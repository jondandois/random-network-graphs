window.onload = initialize_map;

function initialize_map(){
  window.OrgNet = {
    mapSize: document.getElementById('map').width,
    pt_size: 10,
    map: {},
    markers: []
  };
  add_leaflet_map();
  random_orgs();
}

// add a new leaflet map
function add_leaflet_map () {
  OrgNet.map = L.map('map').setView([39.29, -76.61], 12);
    // add a base map
  let OpenStreetMap_BlackAndWhite = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(OrgNet.map);
}

// build graph from random values
function random_orgs() {
  const n_orgs = document.getElementById("n_orgs").value || 10;
  OrgNet.orgs = get_network(n_orgs);
  draw_network(OrgNet.orgs);
}

// get values from input fields
function build_from_input(){
  let locations, associations;
  locations = document.getElementById('locations').value.trim().split('\n');
  associations = document.getElementById('associations').value.trim().split('\n');
  locations = string_array_to_object(locations);
  associations = string_array_to_object(associations);
  Object.keys(locations).map(location_id => {
    OrgNet.orgs[location_id] = {};
    let latlng = locations[location_id].split(', ');
    OrgNet.orgs[location_id]['id'] = location_id;
    OrgNet.orgs[location_id]['location'] = {lat: parseFloat(latlng[0]), lng: parseFloat(latlng[1])}
    OrgNet.orgs[location_id]['color'] = random_rgb();
    if (associations[location_id] === "") {
      OrgNet.orgs[location_id]['network'] = []
    } else {
      OrgNet.orgs[location_id]['network'] = associations[location_id].replace(/(^,)|(,$)/g, "").split(', ');
    }
  });
  draw_network(OrgNet.orgs);
}

// generate n names
function list_of_orgs (n) {
  let orgs = [];
  for (var i = 0; i < n; i++) {
    let char = `org-${i}`;
    orgs[i] = char;
  }
  return orgs;
}

// generate random network
function get_network (n) {
  let orgs = list_of_orgs(n);
  let orgs_net = {}
  for (var k = 0; k < orgs.length; k++) {
    let random_size = get_random_int(0, orgs.length);
    orgs_net[orgs[k]] = {}
    orgs_net[orgs[k]]['id'] = orgs[k];
    orgs_net[orgs[k]]['network'] = get_random_sample(orgs, random_size, orgs[k]);
    orgs_net[orgs[k]]['location'] = get_random_location();
    orgs_net[orgs[k]]['color'] = random_rgb();
  }
  return orgs_net;
}

// get a random value
function get_random(length) { return Math.floor(Math.random()*(length)); }

// get a random sample
function get_random_sample(array, size, exclude) {
    let length = array.length;
    let arr_copy = JSON.parse(JSON.stringify(array));
    for(let i = size; i--;) {
        let index = get_random(length);
        let temp = arr_copy[index];
        arr_copy[index] = arr_copy[i];
        arr_copy[i] = temp;
    }
    let sample = arr_copy.slice(0, size);
    sample.splice(sample.indexOf(exclude), 1);
    return sample;
}

// get a random XY location for each
function get_random_location() {
  let bounds = OrgNet.map.getBounds();
  return {lat: get_random_float(bounds._southWest.lat, bounds._northEast.lat),
          lng: get_random_float(bounds._southWest.lng, bounds._northEast.lng)};
}

// get a random int between
function get_random_int(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

// get a random float between
function get_random_float(min, max) {
  return (Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

// return a random rgba() string
function random_rgb() {
  let r,g,b;
  let a = 1
  r = Math.floor(Math.random()*255);
  g = Math.floor(Math.random()*255);
  b = Math.floor(Math.random()*255);
  return `rgba(${r},${g},${b},${a})`;
}

// draw the network graph
function draw_network(orgs) {
  clear_layers();

  let locations_value = "";
  let associations_value = "";
  Object.keys(orgs).map( org_id => {
    let org = orgs[org_id];
    locations_value += `${org_id}: ${org.location.lat.toFixed(6)}, ${org.location.lng.toFixed(6)}\n`;
    associations_value += `${org_id}: `;

    org.network.map( network_org => {
      associations_value += `${network_org}, `
      draw_line_between(org, orgs[network_org]);
    });

    let marker = L.circle([org.location.lat, org.location.lng], {
      color: org.color,
      fillColor: org.color,
      fillOpacity: 0.5,
      radius: 6400*Math.exp(OrgNet.map.getZoom() * -0.35)
    });
    marker.addTo(OrgNet.map);
    marker.bindPopup(org_id);
    OrgNet.markers.push(marker);

    associations_value += "\n";
    // ctx.font = "15px Arial";
    // ctx.strokeStyle = 'black';
    // ctx.fillText(org_id, org.location.x + OrgNet.pt_size, org.location.y + OrgNet.pt_size);
  });
  document.getElementById('locations').value = locations_value;
  document.getElementById('associations').value = associations_value;
  // document.getElementById('map-canvas').addEventListener('click', evt => {
  //   console.log(evt.clientX + ',' + evt.clientY);
  // });
}

// draw a line between two points
function draw_line_between(org_begin, org_end) {
  let pointA = new L.LatLng(org_begin.location.lat, org_begin.location.lng);
  let pointB = new L.LatLng(org_end.location.lat, org_end.location.lng);
  let pointList = [pointA, pointB];

  let polyline = new L.Polyline(pointList, {
    color: org_begin.color,
    weight: 3,
    opacity: 0.5,
  });

  polyline.bindPopup(org_begin.id + ' <-> ' + org_end.id);
  OrgNet.markers.push(polyline);
  polyline.addTo(OrgNet.map);
}

// clear the markers out
function clear_layers () {
  for (var i = OrgNet.markers.length - 1; i >= 0; i--) {
    OrgNet.markers[i].remove();
    OrgNet.markers.pop();
  }
}

// convert an array of strings ["key: value", "key: value"...] to an object
function string_array_to_object(array){
  let obj = {};
  for (let i = 0; i < array.length; i++) {
      let split = array[i].split(':');
      obj[split[0].trim()] = split[1].trim();
  }
  return obj;
}
