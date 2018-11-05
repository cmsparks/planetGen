/* Sorry if you're reading this, the code is a mess, but it does cool stuff */

let controlToggle = true;

document.addEventListener("keydown", function (event) {
	if (event.keyCode === 27) controlToggle = !controlToggle
});

let scene = new THREE.Scene();
let clock, camera, renderer, cube;
let animIndex;


let Planet = {
	seed: Math.round(Math.random()*65535),
	hasWater: true,
	wireframe: false,
	waterScale: 0.7,
	res: 100,
	waterColor: 0x8888ff,
	addColor: addColor,
	colorMapLength: 5,
	regenGeometry: genGeometry,
	scale: 2
}

let objectList = [];

let gui = new dat.GUI()
let scale = gui.add(Planet, 'scale', 0, 10)
let seed = gui.add(Planet, 'seed', 0,65535)
let waterCtl = gui.add(Planet, 'hasWater')
let wfCtl = gui.add(Planet, 'wireframe')
let sclCtl = gui.add(Planet, 'waterScale', -2,2)
let resCtl = gui.add(Planet, 'res', 25, 300)
let wclrCtl = gui.addColor(Planet, 'waterColor')
let colorCtl = gui.addFolder("Colors")
gui.add(Planet, "regenGeometry")


initColors()
console.log(Planet)
function initColors() {
	let colorArray = [[ 0.0, 0xffffff ], [ 0.2, 0xdddddd ], [ 0.5, 0xdddd00 ], [ 0.75, 0x44FF44 ], [ 1.0, 0xdddddd ]]
	
	for(color in colorArray) {
		//this is a hack because dat.gui doesn't support arrays in objects
		Planet["color"+color] = colorArray[color][1]
		Planet["offset"+color] = colorArray[color][0]
		colorCtl.addColor(Planet, "color"+color)
		colorCtl.add(Planet, "offset"+color, 0, 1)
	}
}

function colorsToColorMap() {
	//hack because javascript
	let colorMap = []
	console.log(JSON.parse(JSON.stringify(Planet)))
	for(let i = 0; i < Planet.colorMapLength; i++) {
		console.log("color"+i)
		let str = "color"+i
		let stro = "offset"+i
		let clr = Planet[str]
		let offset = Planet[stro]
		colorMap.push([offset,clr])
	}
	console.log(colorMap)
	return colorMap;
}

function addColor() {
	Planet.colorMapLength++;
	Planet["color"+color] = 0xFFFFFF;
	Planet["color"+color+" offset"] = 1.0;
	colorCtl.addColor(Planet, "color"+color)
	colorCtl.add(Planet, "offset"+color, 0, 1)

}


init();
animate();


function init() {
	clock = new THREE.Clock();

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 );
	camera.position.x = -208
	camera.position.y = 16
	camera.position.z = -46
	controls = new THREE.FirstPersonControls( camera );
	controls.movementSpeed = 100;
	controls.lookSpeed = .3;
	controls.lookVertical = true;
	
        controls.object.rotation.x = -2
        controls.object.rotation.y = .95
        controls.object.rotation.z = 2.15
	
	genGeometry()

	var lights = [];
		lights[ 0 ] = new THREE.PointLight( 0xbbbbbb, 1, 0 );
		lights[ 1 ] = new THREE.PointLight( 0xbbbbbb, 1, 0 );
		lights[ 0 ].position.set( -200, 200, 0 );
		lights[ 1 ].position.set( -110, 200, 110 );
		scene.add( lights[ 0 ] );
		scene.add( lights[ 1 ] );
	/*let light = new THREE.DirectionalLight(0xffffff, 1)
	light.rotation.set(30,40,30)
	scene.add(light)*/


	renderer = new THREE.WebGLRenderer({antialias: true});
	//050510
	renderer.setClearColor(0x111133, 1);
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );
	window.addEventListener( 'resize', onWindowResize, false );
	controls.update( clock.getDelta() )
}

function genGeometry() {
	console.log(Planet);
	console.log(objectList)
	for(let obj in objectList) {
		let selectedObj = scene.getObjectByName(obj.name)
		console.log(obj)
		console.log(selectedObj)
		
		scene.remove(objectList[obj])

	}
	
	objectList = [];

	let geometry = new THREE.BoxBufferGeometry( 1, 1, 1, Planet.res, Planet.res, Planet.res);
        console.log(geometry)
        geometry = normalizeSphere(geometry);
	
	geometry = generateTerr(geometry);
        geometry = generateSimplexVertexColors(geometry);
	
	geometry.computeVertexNormals();
        let material = new THREE.MeshPhongMaterial( {vertexColors: THREE.VertexColors} );
	
	cube = new THREE.Mesh( geometry, material );
        cube.scale.set(100,100,100)
        scene.add( cube );
	objectList.push( cube );
	
	console.log("Planet has water"+Planet.hasWater)
	if(Planet.hasWater === true) {
		console.log("asdf")
		let waterGeo = new THREE.SphereBufferGeometry(1, 24, 24)
        	let waterMat = new THREE.MeshPhongMaterial({color: Planet.waterColor})
        	let water = new THREE.Mesh( waterGeo, waterMat);
        	water.scale.set(Planet.waterScale+100, Planet.waterScale+100, Planet.waterScale+100)
        	scene.add(water)
		objectList.push(water);
	}

	if (Planet.wireframe) {
		var wireframe = new THREE.WireframeGeometry( geometry );

        	var line = new THREE.LineSegments( wireframe );
        	line.material.depthTest = false;
        	line.material.opacity = 0.75;
        	line.material.transparent = true;
        	line.scale.set(100,100,100)
        	scene.add( line );
		objectList.push(line)
	}

}


function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
	if(controlToggle) {controls.update( clock.getDelta() )};
}

function generateVertexColors(vertexGeometry) {
	let colorsArr = [];
	for(let i = 0; i < vertexGeometry.attributes.position.array.length; i=i+3) {
		let cols = HSVtoRGB(i/vertexGeometry.attributes.position.array.length, 1, 1)
		//console.log(cols);
		colorsArr.push(cols[0]/255);
		colorsArr.push(cols[1]/255);
		colorsArr.push(cols[2]/255);
	}
	let colors = new Float32Array(colorsArr);

	// itemSize = 3 because there are 3 values (components) per vertex
	vertexGeometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
	vertexGeometry.attributes.color.dynamic = true;
	return vertexGeometry;
}

function generateTerr(sphereGeometry) {
	sphereGeometry.computeVertexNormals()
	for(let i = 0; i < sphereGeometry.attributes.position.array.length; i=i+3) {
		let nout = noiseGen(sphereGeometry.attributes.position.array[i],sphereGeometry.attributes.position.array[i+1],sphereGeometry.attributes.position.array[i+2], 2.5, 6, .75);
		sphereGeometry.attributes.position.array[i] += sphereGeometry.attributes.normal.array[i]*((nout/100)*Planet.scale);
		sphereGeometry.attributes.position.array[i+1] += sphereGeometry.attributes.normal.array[i+1]*((nout/100)*Planet.scale);
		sphereGeometry.attributes.position.array[i+2] += sphereGeometry.attributes.normal.array[i+2]*((nout/100)*Planet.scale);
		//console.log(sphereGeometry.attributes.position.array[i+2])
		//console.log(sphereGeometry.attributes.normal.array[i+2])
	}
	return sphereGeometry
}

function normalizeSphere(sphereGeometry) {
	for(let i = 0; i < sphereGeometry.attributes.position.array.length; i=i+3){
		let x = convertBounds(sphereGeometry.attributes.position.array[i])
		let y = convertBounds(sphereGeometry.attributes.position.array[i+1])
		let z = convertBounds(sphereGeometry.attributes.position.array[i+2])
		let sx = x * Math.sqrt(1-y * y * 0.5 - z * z * 0.5 + y * y * z * z / 3.0);
		let sy = y * Math.sqrt(1-z * z * 0.5 - x * x * 0.5 + z * z * x * x / 3.0);
		let sz = z * Math.sqrt(1-x * x * 0.5 - y * y * 0.5 + x * x * y * y / 3.0);
		sphereGeometry.attributes.position.array[i] = sx
		sphereGeometry.attributes.position.array[i+1] = sy
		sphereGeometry.attributes.position.array[i+2] = sz
	}
	return sphereGeometry;
}

function convertBounds(num) {
	return (num*2);
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function generateEarthCubemap() {
	let top = new THREE.MeshBasicMaterial( {map: topTex} );
	let side1 = new THREE.MeshBasicMaterial( {map: side1Tex} );
	let side2 = new THREE.MeshBasicMaterial( {map: side2Tex} );
	let side3 = new THREE.MeshBasicMaterial( {map: side3Tex} );
	let side4 = new THREE.MeshBasicMaterial( {map: side4Tex} );
	let bottom = new THREE.MeshBasicMaterial( {map: botTex} );
	return [side3, side2, top, bottom, side1, side4];
}

function generateSimplexVertexColors(vertexGeometry) {
	let colorsArr = [];
	let colorMap = colorsToColorMap();
	THREE.ColorMapKeywords["terrainMap"] = colorMap
	let lut = new THREE.Lut("terrainMap", 512)
	/*console.log(colorMap)
	lut.addColorMap( "terrainMap", colorMap )
	lut = lut.changeColorMap("terrainMap");
	*/lut.setMin(0.05)
	lut.setMax(0.95)
	console.log(lut)
	for(let i = 0; i < vertexGeometry.attributes.position.array.length; i=i+3) {
		let ox = vertexGeometry.attributes.position.array[i];
		let oy = vertexGeometry.attributes.position.array[i+1];
		let oz = vertexGeometry.attributes.position.array[i+2];
		let nout = noiseGen(ox,oy,oz, 2.5, 6, .75); //noise.simplex3(ox,oy,oz)
		nout = (nout+2)/4
		
		let color = lut.getColor(nout);
		colorsArr.push(color.r)
		colorsArr.push(color.g)
		colorsArr.push(color.b)
		/*if(nout <0.57) {
			/*colorsArr.push(202/255);
                        colorsArr.push(100/255);
                        colorsArr.push(242/255);
			colorsArr.push(nout)
			colorsArr.push(nout)
			colorsArr.push(nout)
			
			colorsArr.push(255/255);
			colorsArr.push(210/255);
			colorsArr.push(5/255);
		}
		else if(nout < 0.75) {
			/*colorsArr.push(202/255);
                        colorsArr.push(80/255);
                        colorsArr.push(242/255)*/
			/*colorsArr.push(nout)
			colorsArr.push(nout)
			colorsArr.push(nout)
			colorsArr.push(146/255);
			colorsArr.push(255/255);
			colorsArr.push(36/255);
		}
		else {
			/*colorsArr.push(162/255);
                        colorsArr.push(60/255);
                        colorsArr.push(242/255)
			colorsArr.push(nout);
			colorsArr.push(nout);
			colorsArr.push(nout);
		}*/
		/*let cols = HSVtoRGB(nout, 1, 1)
		colorsArr.push(cols[0]/255);
		colorsArr.push(cols[1]/255);
		colorsArr.push(cols[2]/255);*/
		/*colorsArr.push(nout);
		colorsArr.push(nout);
		colorsArr.push(nout);*/
	}
	let colors = new Float32Array(colorsArr);

	// itemSize = 3 because there are 3 values (components) per vertex
	vertexGeometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
	vertexGeometry.attributes.color.dynamic = true;
	return vertexGeometry;
}

function noiseGen(ix,iy,iz,scale,octaves,persistence) {
	//let heightmap = [...Array(w)].map(i => Array(l));
	let nout = 0;
	noise.seed(Planet.seed)
	/*for(let i = 0; i < octaves; i++){
		seeds.push(Math.random());
	}*/
	let maxAmp = 0
	let amp = 1
	let freq = scale
	for(let k = 0; k < octaves; k++){
		//noise.seed(seeds[k]);
		nout += noise.simplex3(ix*scale,iy*scale,iz*scale);
		maxAmp += amp;
		amp *= persistence;
		freq *= 2
	}
	nout /= maxAmp;
	return nout;
}

function generatePerlinTexture() {
	
}
