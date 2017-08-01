window.onload = initialize_graph;

function initialize_graph(){
  window.OrgNet = {
    mapSize: document.getElementById('map-canvas').width,
    pt_size: 10
  };
  random_orgs();
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
    let xy = locations[location_id].split(', ');
    OrgNet.orgs[location_id]['location'] = {x: parseInt(xy[0]), y: parseInt(xy[1])}
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
  return {x: parseInt(Math.random() * OrgNet.mapSize), y: parseInt(Math.random() * OrgNet.mapSize)};
}

// get a random int between
function get_random_int(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
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
function draw_network(orgs) {
  let canvas = document.getElementById('map-canvas');
  let ctx = canvas.getContext("2d");
  let canvasWidth = canvas.width;
  let canvasHeight = canvas.height;
  let canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  ctx.clearRect(0,0, canvasWidth, canvasHeight);
  ctx.fillStyle = "#e2e2e2";
  ctx.fillRect(0,0, canvasWidth, canvasHeight);

  let locations_value = "";
  let associations_value = "";
  Object.keys(orgs).map( org_id => {
    let org = orgs[org_id];
    ctx.fillStyle = org.color;
    locations_value += `${org_id}: ${org.location.x}, ${org.location.y}\n`;
    associations_value += `${org_id}: `;

    ctx.fillRect(org.location.x, org.location.y, OrgNet.pt_size, OrgNet.pt_size);
    org.network.map( network_org => {
      associations_value += `${network_org}, `
      draw_line_between(org.location, orgs[network_org].location, org.color, ctx);
    });
    associations_value += "\n";
    ctx.font = "15px Arial";
    ctx.strokeStyle = 'black';
    ctx.fillText(org_id, org.location.x + OrgNet.pt_size, org.location.y + OrgNet.pt_size);
  });
  document.getElementById('locations').value = locations_value;
  document.getElementById('associations').value = associations_value;
  // document.getElementById('map-canvas').addEventListener('click', evt => {
  //   console.log(evt.clientX + ',' + evt.clientY);
  // });
}

// draw a line between two points
function draw_line_between(begin, end, color, ctx) {
  ctx.beginPath();
  ctx.lineWidth = "2";
  ctx.strokeStyle = color;
  ctx.moveTo(begin.x + OrgNet.pt_size/2,begin.y + OrgNet.pt_size/2);
  ctx.lineTo(end.x  + OrgNet.pt_size/2, end.y  + OrgNet.pt_size/2);
  ctx.stroke();
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
