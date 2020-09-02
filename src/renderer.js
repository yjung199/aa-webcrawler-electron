// Todo:
// 60 results display - done
// fix image - done
// cut down website - done
// Pagination - done
// Save to CSV - done
// Link in Google Map - done
// Connection check - done
// Remove pictures - done
// Limit daily search count to 300 - done
// Reduced detail search - done

const { ipcRenderer, shell, remote, dialog } = require('electron');
const Store = require('electron-store');
const date = new Date();
const hour = date.getHours();
const fastcsv = require('fast-csv');
const fs = require('fs');
const { stringify } = require('querystring');
const title = document.getElementById('title');
const results = document.getElementById('results');
const icon = document.getElementById('save');
let dailyLimit = 10;

title.innerText = titleHour(hour);
const schema = {
  lastUpdateDate: {
    type: 'number',
    maximum: 31,
    minimum: 1,
    default: 1,
  },
  dailySearched: {
    type: 'number',
    default: 0,
  },
};

const store = new Store({ schema });

let nextToken = '';
let data = [];
let pagination = [];

function titleHour(hour) {
  switch (true) {
    case hour <= 6:
      return '🦉 Early bird!';
    case hour <= 11:
      return '☕️ Good morning!';
    case hour <= 14:
      return '🌯 How was your lunch?';
    case hour <= 18:
      return '☀️ Good afternoon!';
    case hour <= 20:
      return '🥘 How was your dinner?';
    case hour <= 23:
      return '🌙 Good night!';
    default:
      return '✨ How are you?';
  }
}

(function () {
  const dateInCache = store.get('lastUpdateDate');
  console.log(date.getDate());
  console.log(dateInCache);
  if (dateInCache < date.getDate()) {
    store.set('dailySearched', 0);
  }
})();

const notiCtr = document.getElementById('notictr');
notiCtr.innerHTML = `<em>So far, you\'ve searched 
${store.get('dailySearched')} place(s) today.</em>`;

const searchBar = document.getElementById('searchbar');
const searchBtn = document.getElementById('search');
const count = document.getElementById('count');
const info = document.getElementById('info');
const csvBtn = document.getElementById('csv');
const pagenav = document.getElementById('pagenav');
const connection = document.getElementById('connection');
const notiD = document.getElementById('notid');
const noti = document.getElementById('noti');

let online;
ipcRenderer.on('online-status-changed', (e, d) => {
  if (d == 'offline') {
    online = false;
    connection.classList.remove('is-hidden');
    searchBtn.setAttribute('disabled', true);
    results.classList.add('is-hidden');
    pagenav.classList.add('is-hidden');
  } else {
    online = true;

    connection.classList.add('is-hidden');
    searchBtn.removeAttribute('disabled');
    results.classList.remove('is-hidden');
    pagenav.classList.remove('is-hidden');
  }
  console.log(online); // offline online
  limitCheck();
});

function limitCheck() {
  if (store.get('dailySearched') >= dailyLimit) {
    console.log('f');
    notiD.animate(
      [
        // keyframes
        { transform: 'translateY(0%)' },
        { transform: 'translateY(-5%)' },
        { transform: 'translateY(2%)' },
        { transform: 'translateY(-3%)' },
        { transform: 'translateY(1%)' },
        { transform: 'translateY(0%)' },
      ],
      {
        // timing options
        duration: 500,
        easing: 'ease',
      }
    );
    notiD.classList.remove('is-hidden');
    noti.classList.add('is-hidden');
    searchBar.setAttribute('disabled', true);
    searchBtn.setAttribute('disabled', true);
  } else {
    noti.classList.remove('is-hidden');
  }
}

let basics = [];

function initializeSearch() {
  searchBtn.classList.add('is-loading');
  nextToken = '';
  data = [];
  pagination = [];
  basics = [];
  info.classList.add('is-invisible');
  pagenav.classList.add('is-invisible');
  icon.innerHTML = '<i class="far fa-arrow-alt-circle-down"></i>';
  csvBtn.title = 'Save as CSV';
  removeAllChildNodes(results);
  searchLoop()
    .then((list) => {
      Promise.all(list).then((values) => {
        const pages = chunk(values, 10);
        for (page of pages) {
          // let boxes = [];
          // for (detail of page) {
          //   boxes.push(fillBox(detail));
          // }
          // const div = document.createElement('div');
          // for (b of boxes) {
          //   div.appendChild(b);
          // }
          const div = document.createElement('div');
          var i = 0;
          for (detail of page) {
            const name = basics[i].name;
            const rating = basics[i].rating;
            const addr = basics[i].addr;
            div.appendChild(fillBox(name, rating, addr, detail));
            i = i + 1;
          }
          pagination.push(div);
          console.log(pagination);
          // Display initial page
          if (pagination.length == 1) {
            results.appendChild(pagination[0]);
          }
        }
        console.log(pagination);
        pageNavSetup(pagination.length);
        console.log(values);
        info.classList.remove('is-invisible');
        if (pagination.length > 0) {
          pagenav.classList.remove('is-invisible');
        }
        count.innerText = `${values.length} results found`;

        updateCache(parseInt(values.length));
      });
    })
    .catch((error) => {
      console.log(error);
    })
    .finally(() => {
      searchBtn.classList.remove('is-loading');
      limitCheck();
      let autoCSV = document.getElementById('autocsv');
      if (autoCSV.checked) {
        toCSV(searchBar.value);
      }
    });
}
searchBar.addEventListener('keyup', (event) => {
  if (event.key === 'Enter' && online) {
    if (searchBar.value) {
      initializeSearch();
    } else {
      searchBar.classList.add('is-danger');
      const el = document.getElementById('invalid-input');
      el.classList.remove('is-hidden');
    }
    // searchBtn.classList.add('is-loading');
    // nextToken = '';
    // data = [];
    // pagination = [];
    // info.classList.add('is-invisible');
    // pagenav.classList.add('is-invisible');
    // icon.innerHTML = '<i class="far fa-arrow-alt-circle-down"></i>';
    // csvBtn.title = 'Save as CSV';
    // removeAllChildNodes(results);
    // searchLoop()
    //   .then((list) => {
    //     Promise.all(list).then((values) => {
    //       const pages = chunk(values, 10);
    //       for (page of pages) {
    //         // let boxes = [];
    //         // for (detail of page) {
    //         //   boxes.push(fillBox(detail));
    //         // }
    //         // const div = document.createElement('div');
    //         // for (b of boxes) {
    //         //   div.appendChild(b);
    //         // }
    //         const div = document.createElement('div');
    //         for (detail of page) {
    //           div.appendChild(fillBox(detail));
    //         }
    //         pagination.push(div);
    //         console.log(pagination);
    //         // Display initial page
    //         if (pagination.length == 1) {
    //           results.appendChild(pagination[0]);
    //         }
    //       }
    //       console.log(pagination);
    //       pageNavSetup(pagination.length);
    //       console.log(values);
    //       info.classList.remove('is-invisible');
    //       if (pagination.length > 0) {
    //         pagenav.classList.remove('is-invisible');
    //       }
    //       count.innerText = `${values.length} results found`;
    //     });
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //   })
    //   .finally(() => {
    //     searchBtn.classList.remove('is-loading');
    //     let autoCSV = document.getElementById('autocsv');
    //     if (autoCSV.checked) {
    //       toCSV(searchBar.value);
    //     }
    //   });
  }
});
searchBtn.addEventListener('click', (event) => {
  console.log('hello');
  if (online) {
    if (searchBar.value) {
      initializeSearch();
    } else {
      searchBar.classList.add('is-danger');
      const el = document.getElementById('invalid-input');
      el.classList.remove('is-hidden');
    }
  }
});

csvBtn.style.setProperty('color', 'inherit', 'important');
csvBtn.addEventListener('click', (event) => {
  toCSV(searchBar.value);
});

const searchBaseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const detailBaseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';

/* Credit:
 * Jonas Wilms
 * https://stackoverflow.com/a/44476626
 */
async function searchLoop() {
  const list2 = [];
  for (let i = 0; i < 3; i++) {
    if (i > 0 && !nextToken) {
      break;
    }
    searchPlace(searchBar.value, nextToken)
      .then((data) => {
        if ('next_page_token' in data) {
          console.log('key exists');
          nextToken = data.next_page_token;
        } else {
          console.log('key doesnt exist');
        }
        for (p of data.results) {
          basics.push({ name: p.name, rating: p.rating, addr: p.formatted_address });
          const placeDetail = searchDetail(p.place_id);
          list2.push(placeDetail);
        }
      })
      .catch((e) => {
        console.log(`There has been a problem with your fetch operation: ${e.message}`);
      });
    await timeout(3500);
  }
  return list2;
}

async function searchPlace(query, nextToken) {
  console.log(query);
  const param = {
    key: gKey,
    query: query,
    pagetoken: nextToken,
  };

  const url = `${searchBaseUrl}?${dictToURI(param)}`;
  console.log(url);
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  } else {
    const data = await response.json();
    if (data.status !== 'OK') {
      throw new Error(`API error! status: ${data.status}`);
    }
    return data;
  }
}

async function searchDetail(placeId) {
  const param = {
    key: gKey,
    place_id: placeId,
    fields: 'formatted_phone_number,website,url',
  };
  const url = `${detailBaseUrl}?${dictToURI(param)}`;
  console.log(url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  } else {
    const data = await response.json();
    if (data.status !== 'OK') {
      throw new Error(`API error! status: ${data.status}`);
    }
    return data;
  }
}

/* Credit:
 * Matt C
 * https://medium.com/@mattccrampton/convert-a-javascript-dictionary-to-get-url-parameters-b77da8c78ec8
 */
function dictToURI(dict) {
  const str = [];
  for (const p in dict) {
    str.push(`${encodeURIComponent(p)}=${encodeURIComponent(dict[p])}`);
  }
  return str.join('&');
}

function timeout(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
async function boxLoop(target, placeDetails) {
  for (var d of placeDetails) {
    console.log(d);
    fillBox(target, d);
  }
}
function fillBox(placeName, rating, placeAddr, placeDetail) {
  let box = document.createElement('div');
  box.className = 'box';
  let article = document.createElement('article');
  article.className = 'media';
  let innerDiv = document.createElement('div');
  // mediaLeft.className = 'media-left';
  // let figure = document.createElement('figure');
  // figure.className = 'image is-128x128';
  // let img = document.createElement('img');
  // const imgBaseUrl = 'https://maps.googleapis.com/maps/api/place/photo';
  // let photoRef = '';
  // if ('photos' in placeDetail.result) {
  //   photoRef = placeDetail.result.photos[0].photo_reference;
  // }
  const name = placeName;
  const addr = placeAddr;
  const phone = placeDetail.result.formatted_phone_number;
  let websiteFull = '';
  let website = '';
  if ('website' in placeDetail.result) {
    websiteFull = placeDetail.result.website;
    website = trimURL(websiteFull);
  }
  const link = placeDetail.result.url;

  // const param = {
  //   key: gKey,
  //   photoreference: photoRef,
  //   maxheight: 256,
  // };

  // if (photoRef) {
  //   const url = `${imgBaseUrl}?${dictToURI(param)}`;
  //   img.src = url;
  //   img.alt = `${placeDetail.result.name}`;
  // }
  toData(name, addr, phone, websiteFull, rating);

  let mediaContent = document.createElement('div');
  mediaContent.className = 'media-content';
  let content = document.createElement('div');
  content.className = 'content';
  let p = document.createElement('p');
  p.innerHTML = `<strong>${name}</strong><br>${addr}<br>${phone}<br>${website}`;

  // if (photoRef) {
  //   appendElements(mediaLeft, figure, img);
  // }
  const nav = createBoxNav(link, websiteFull, rating);
  appendElements(mediaContent, content, p);
  mediaContent.appendChild(nav);
  article.appendChild(innerDiv);
  article.appendChild(mediaContent);
  box.appendChild(article);
  return box;
  // t.appendChild(box);
}

/* Credit:
 * kamoroso94
 * https://codereview.stackexchange.com/a/156684
 */
function appendElements() {
  var nodes = arguments;
  for (var i = 1; i < nodes.length; i++) {
    nodes[i - 1].appendChild(nodes[i]);
  }
}
/* Credit:
 * https://www.javascripttutorial.net/dom/manipulating/remove-all-child-nodes/
 */
function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function createBoxNav(link, url, rating) {
  const nav = document.createElement('nav');
  nav.className = 'level is-mobile';
  const levelLeft = document.createElement('div');
  levelLeft.className = 'level-left';
  const levelItemMap = document.createElement('a');
  levelItemMap.className = 'level-item';
  levelItemMap.href = link;
  levelItemMap.addEventListener('click', function (event) {
    event.preventDefault();
    shell.openExternal(levelItemMap.href);
  });
  levelItemMap.setAttribute('aria-label', 'lookup');

  const iconMap = document.createElement('span');
  iconMap.className = 'icon is-small';
  const iMap = document.createElement('i');
  iMap.className = 'fas fa-map-marked-alt';
  iMap.setAttribute('aria-hidden', 'true');

  if (url) {
    const levelItemURL = document.createElement('a');
    levelItemURL.className = 'level-item';
    levelItemURL.href = url;
    levelItemURL.addEventListener('click', function (event) {
      event.preventDefault();
      shell.openExternal(levelItemURL.href);
    });
    levelItemURL.setAttribute('aria-label', 'lookup');

    const iconURL = document.createElement('span');
    iconURL.className = 'icon is-small';
    const iURL = document.createElement('i');
    iURL.className = 'fas fa-globe';
    iURL.setAttribute('aria-hidden', 'true');

    appendElements(levelItemURL, iconURL, iURL);
    levelLeft.appendChild(levelItemURL);
  }

  appendElements(levelItemMap, iconMap, iMap);
  levelLeft.appendChild(levelItemMap);
  nav.appendChild(levelLeft);
  const levelRight = generateStarRating(rating);
  nav.appendChild(levelRight);
  return nav;
}

function trimURL(url) {
  if (url.lastIndexOf('?') > -1) {
    let i = url.lastIndexOf('?');
    return url.slice(0, i);
  }
  return url;
}
function toData(name, address, phone, website, rating) {
  let dict = {
    Name: name,
    Address: address,
    Phone: phone,
    Website: website,
    Rating: rating,
  };
  data.push(dict);
  console.log(data);
}
function toCSV(query) {
  const dialog = remote.dialog;
  const win = remote.getCurrentWindow();
  const options = {
    title: 'Save CSV file',
    defaultPath: remote.app.getPath('downloads') + `/${query}.csv`,
    filters: [{ name: 'Comma-separated values', extensions: ['csv'] }],
  };

  dialog
    .showSaveDialog(win, options)
    .then((r) => {
      if (!r.canceled) {
        const ws = fs.createWriteStream(r.filePath);
        fastcsv.write(data, { headers: true }).pipe(ws);
        icon.innerHTML = '<i class="fas fa-chevron-circle-down"></i>';
        csvBtn.title = 'Saved!';
      } else {
        console.log('Save canceled by user');
      }
    })
    .catch((e) => {
      console.log(`Error saving file! ${e}`);
    });
}

// Document-wise click event listener
document.addEventListener('click', function (event) {
  // Open all links in external browser
  if (event.target.tagName === 'A' && event.target.href.startsWith('http')) {
    event.preventDefault();
    shell.openExternal(event.target.href);
  }

  // Pagination Control
  if (event.target.tagName === 'A' && event.target.parentNode.id.startsWith('page')) {
    console.log(event.target.innerText);
    if (!event.target.hasAttribute('disabled')) {
      pageNavController(event.target);
    }
  }

  if (event.target.tagName === 'BUTTON' && event.target.id === 'noticls') {
    closeWarningNoti();
  }
});
/* Credit:
 * Dave Furfero (furf)
 * https://stackoverflow.com/a/11764168
 */
function chunk(arr, len) {
  var chunks = [],
    i = 0,
    n = arr.length;

  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }
  return chunks;
}

const pageList = document.getElementById('pagelist');
function pageNavSetup(pageNum) {
  // Empty out list
  pageList.querySelectorAll('*').forEach((n) => n.remove());
  // Setting up Nav
  var i;
  for (i = 1; i <= pageNum; i++) {
    let li = document.createElement('li');
    li.id = `page${i}`;
    let a = document.createElement('a');
    a.classList.add('pagination-link');
    if (i == 1) {
      a.classList.add('is-current');
      a.setAttribute('aria-label', `Page ${i}`);
      a.setAttribute('aria-current', 'page');
    }
    a.setAttribute('aria-label', `Goto page ${i}`);

    a.innerText = `${i}`;
    li.appendChild(a);
    appendElements(li, a);
    pageList.appendChild(li);
  }
}

function pageNavController(t) {
  // is-current control and find out currentPage
  let currentPage;
  for (child of pageList.childNodes) {
    console.log(child);
    if (child.firstChild.classList.contains('is-current')) {
      currentPage = child.firstChild.innerText;
    }
    child.firstChild.classList.remove('is-current');
  }

  let pageNumber;
  if (t.innerText == 'Previous') {
    pageNumber = currentPage - 1;
  } else if (t.innerText == 'Next') {
    pageNumber = 1 + +currentPage;
  } else {
    pageNumber = t.innerText;
  }
  console.log(currentPage);
  console.log(pageNumber);
  const x = document.getElementById(`page${pageNumber}`);
  x.firstChild.classList.add('is-current');
  // t.classList.add('is-current');

  const pagePrev = document.getElementById('pageprev');
  const pageNext = document.getElementById('pagenext');
  results.firstChild.replaceWith(pagination[pageNumber - 1]);
  if (pageNumber == 1) {
    pagePrev.setAttribute('disabled', true);
    pageNext.removeAttribute('disabled');
  } else if (pageNumber > 1 && pageNumber < pagination.length) {
    pagePrev.removeAttribute('disabled');
    pageNext.removeAttribute('disabled');
  } else {
    pagePrev.removeAttribute('disabled');
    pageNext.setAttribute('disabled', true);
  }
}

function generateStarRating(rating) {
  const levelRight = document.createElement('div');
  levelRight.classList.add('level-right');
  const levelItemStar = document.createElement('div');
  let r = parseFloat(rating);
  var i;
  for (i = 0; i < 5; i++) {
    let el = document.createElement('span');
    el.className = 'icon has-text-warning';
    if (r >= 1) {
      el.innerHTML = '<i class="fas fa-star"></i>';
    } else if (r > 0 && r < 1) {
      el.innerHTML = '<i class="fas fa-star-half-alt"></i>';
    } else {
      el.innerHTML = '<i class="far fa-star"></i>';
    }
    r = r - 1;
    levelItemStar.appendChild(el);
  }

  levelRight.appendChild(levelItemStar);
  return levelRight;
}

function updateCache(r) {
  store.set('lastUpdateDate', date.getDate());
  var n = store.get('dailySearched');
  store.set('dailySearched', n + r);
  console.log(`So far, you've searched ${store.get('dailySearched')} results`);
  notiCtr.innerHTML = `<em>So far, you\'ve searched 
  ${store.get('dailySearched')} place(s) today.</em>`;
}

console.log(store.get('dailySearched'));

function closeWarningNoti() {
  noti.animate(
    [
      // keyframes
      { opacity: 1 },
      { opacity: 0 },
    ],
    {
      // timing options
      duration: 500,
      easing: 'ease',
    }
  );
  setTimeout(() => {
    noti.classList.add('is-hidden');
  }, 450);
}
