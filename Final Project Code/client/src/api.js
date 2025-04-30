const BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";

export function getColumns() {
  return fetch(`${BASE}/columns`).then(r => r.json());
}
export function getData(col) {
  return fetch(`${BASE}/getdata?column=${col}`).then(r => r.json());
}
export function getScatter(y) {
  return fetch(`${BASE}/scatter_data?column=${y}`).then(r => r.json());
}
export function getPie() {
  return fetch(`${BASE}/pie-chart`).then(r => r.json());
}
export function getPCP() {
  return fetch(`${BASE}/pcp`).then(r => r.json());
}
export function getMap() {
  return fetch(`${BASE}/data/map`).then(r => r.json());
}
export function getBubble(obs) {
  return fetch(`${BASE}/data/bubbleChart/${obs}`).then(r => r.json());
}
export function getClusters(obs) {
  return fetch(`${BASE}/data/dbscanChart/${obs}`).then(r => r.json());
}
