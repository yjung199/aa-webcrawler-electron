// Todo:
// 60 results display - done
// fix image - done
// cut down website - done
// Pagination
// Save to CSV - done
// Link in Google Map - done

const { ipcRenderer, shell, remote } = require('electron');
const hour = new Date().getHours();
const fastcsv = require('fast-csv');
const fs = require('fs');
const { stringify } = require('querystring');
const title = document.getElementById('title');
const results = document.getElementById('results');
const icon = document.getElementById('save');
title.innerText = titleHour(hour);

let nextToken = '';
let data = [];

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

const searchBar = document.getElementById('searchbar');
const searchBtn = document.getElementById('search');
const count = document.getElementById('count');
const info = document.getElementById('info');
const csvBtn = document.getElementById('csv');
// info.style.visibility = 'hidden';
searchBar.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    searchBtn.classList.add('is-loading');
    nextToken = '';
    data = [];
    info.classList.add('is-invisible');
    icon.innerHTML = '<i class="far fa-arrow-alt-circle-down"></i>';
    csvBtn.title = 'Save as CSV';
    removeAllChildNodes(results);
    searchLoop()
      .then((list) => {
        Promise.all(list).then((values) => {
          boxLoop(results, values);
          console.log(values);
          info.classList.remove('is-invisible');
          count.innerText = `${values.length} results found`;
        });
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        searchBtn.classList.remove('is-loading');
      });
  }
});
searchBtn.addEventListener('click', (event) => {
  if (event.key === 'Enter') {
    searchBtn.classList.add('is-loading');
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
  const list = [];
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
          // list.push(p);
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
    fields:
      'name,formatted_address,business_status,formatted_phone_number,website,photo,international_phone_number,url',
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
function fillBox(t, placeDetail) {
  let box = document.createElement('div');
  box.className = 'box';
  let article = document.createElement('article');
  article.className = 'media';
  let mediaLeft = document.createElement('div');
  mediaLeft.className = 'media-left';
  let figure = document.createElement('figure');
  figure.className = 'image is-128x128';
  let img = document.createElement('img');
  const imgBaseUrl = 'https://maps.googleapis.com/maps/api/place/photo';
  let photoRef = '';
  if ('photos' in placeDetail.result) {
    photoRef = placeDetail.result.photos[0].photo_reference;
  }
  const name = placeDetail.result.name;
  const addr = placeDetail.result.formatted_address;
  const phone = placeDetail.result.formatted_phone_number;
  let websiteFull = '';
  let website = '';
  if ('website' in placeDetail.result) {
    websiteFull = placeDetail.result.website;
    website = trimURL(websiteFull);
  }
  const link = placeDetail.result.url;

  const param = {
    key: gKey,
    photoreference: photoRef,
    maxheight: 256,
  };

  if (photoRef) {
    const url = `${imgBaseUrl}?${dictToURI(param)}`;
    img.src = url;
    img.alt = `${placeDetail.result.name}`;
  }
  toData(name, addr, phone, websiteFull);

  let mediaContent = document.createElement('div');
  mediaContent.className = 'media-content';
  let content = document.createElement('div');
  content.className = 'content';
  let p = document.createElement('p');
  p.innerHTML = `<strong>${name}</strong><br>${addr}<br>${phone}<br>${website}`;

  if (photoRef) {
    appendElements(mediaLeft, figure, img);
  }
  const nav = createBoxNav(link, websiteFull);
  appendElements(mediaContent, content, p);
  mediaContent.appendChild(nav);
  article.appendChild(mediaLeft);
  article.appendChild(mediaContent);
  box.appendChild(article);
  t.appendChild(box);
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

function createBoxNav(link, url) {
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
  return nav;
}

function trimURL(url) {
  if (url.lastIndexOf('?') > -1) {
    let i = url.lastIndexOf('?');
    return url.slice(0, i);
  }
  return url;
}
function toData(name, address, phone, website) {
  let dict = {
    Name: name,
    Address: address,
    Phone: phone,
    Website: website,
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
        csvBtn.title = 'Saved';
      } else {
        console.log('Save canceled by user');
      }
    })
    .catch((e) => {
      console.log(`Error saving file! ${e}`);
    });
}

// Open all links in external browser
document.addEventListener('click', function (event) {
  if (event.target.tagName === 'A' && event.target.href.startsWith('http')) {
    event.preventDefault();
    shell.openExternal(event.target.href);
  }
});
