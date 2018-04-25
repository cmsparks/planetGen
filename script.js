let scene, clock, camera, renderer, cube;
let animIndex;

let topTex = new THREE.TextureLoader().load('Top.png')
let side1Tex = new THREE.TextureLoader().load('Side1.png')
let side2Tex = new THREE.TextureLoader().load('Side2.png')
let side3Tex = new THREE.TextureLoader().load('Side3.png')
let side4Tex = new THREE.TextureLoader().load('Side4.png')
let botTex = new THREE.TextureLoader().load('Bottom.png')

init();
animate();
function init() {
	scene = new THREE.Scene();
	clock = new THREE.Clock();

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 );
	controls = new THREE.FirstPersonControls( camera );
	controls.movementSpeed = 100;
	controls.lookSpeed = .3;
	controls.lookVertical = true;

	let geometry = new THREE.BoxBufferGeometry( 1, 1, 1, 100, 100, 100);
	console.log(geometry)
	geometry = normalizeSphere(geometry);

	geometry = generateTerr(geometry);
	geometry = generatePerlinVertexColors(geometry);
	geometry.computeVertexNormals();
	let material = new THREE.MeshPhongMaterial( {vertexColors: THREE.VertexColors} );
	/*let material2 = new THREE.MeshBasicMaterial( {color: 0xffffff} );
	let material = [material1, material2,material2,material2,material2,material2]*/
	//let material = generateEarthCubemap();
	cube = new THREE.Mesh( geometry, material );
	cube.scale.set(100,100,100)
	scene.add( cube );

	let waterGeo = new THREE.SphereBufferGeometry(1, 24, 24)
	let waterMat = new THREE.MeshPhongMaterial({color: 0x0000ff})
	let water = new THREE.Mesh( waterGeo, waterMat);
	water.scale.set(100,100,100)
	scene.add(water)

	var wireframe = new THREE.WireframeGeometry( geometry );

	var line = new THREE.LineSegments( wireframe );
	line.material.depthTest = false;
	line.material.opacity = 0.25;
	line.material.transparent = true;
	line.scale.set(100,100,100)
	//scene.add( line );

	var lights = [];
		lights[ 0 ] = new THREE.PointLight( 0x888888, 1, 0 );
		lights[ 1 ] = new THREE.PointLight( 0x888888, 1, 0 );
		lights[ 2 ] = new THREE.PointLight( 0x888888, 1, 0 );
		lights[ 0 ].position.set( 200, 200, 0 );
		lights[ 1 ].position.set( 110, 200, 110 );
		lights[ 2 ].position.set( - 110, - 200, - 110 );
		scene.add( lights[ 0 ] );
		scene.add( lights[ 1 ] );
		scene.add( lights[ 2 ] );/*
	let light = new THREE.DirectionalLight(0xffffff, 1)
	light.rotation.set(0,90,0)
	scene.add(light)*/


	renderer = new THREE.WebGLRenderer();
	//050510
	renderer.setClearColor(0xffffff, 1);
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );
	window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize(){

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
	controls.update( clock.getDelta() );
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
	console.log(colorsArr);
	let colors = new Float32Array(colorsArr);

	// itemSize = 3 because there are 3 values (components) per vertex
	vertexGeometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
	vertexGeometry.attributes.color.dynamic = true;
	return vertexGeometry;
}

function generateTerr(sphereGeometry) {
	sphereGeometry.computeVertexNormals()
	for(let i = 0; i < sphereGeometry.attributes.position.array.length; i=i+3) {
		let nout = noiseGen(sphereGeometry.attributes.position.array[i],sphereGeometry.attributes.position.array[i+1],sphereGeometry.attributes.position.array[i+2], 4, 6, .75);
		sphereGeometry.attributes.position.array[i] += sphereGeometry.attributes.normal.array[i]*(nout/100);
		sphereGeometry.attributes.position.array[i+1] += sphereGeometry.attributes.normal.array[i+1]*(nout/100);
		sphereGeometry.attributes.position.array[i+2] += sphereGeometry.attributes.normal.array[i+2]*(nout/100);
		//console.log(sphereGeometry.attributes.position.array[i+2])
		//console.log(sphereGeometry.attributes.normal.array[i+2])
	}
	console.log(sphereGeometry)
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
	console.log(sphereGeometry)
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

function generatePerlinVertexColors(vertexGeometry) {
	let colorsArr = [];
	for(let i = 0; i < vertexGeometry.attributes.position.array.length; i=i+3) {
		let ox = vertexGeometry.attributes.position.array[i];
		let oy = vertexGeometry.attributes.position.array[i+1];
		let oz = vertexGeometry.attributes.position.array[i+2];
		let nout = noiseGen(ox,oy,oz, 4, 6, .75); //noise.simplex3(ox,oy,oz)
		nout = (nout+2)/4
		if(nout <0.5) {
			colorsArr.push(255/255);
			colorsArr.push(210/255);
			colorsArr.push(5/255);
		}
		else if(nout < 0.75) {
			colorsArr.push(146/255);
			colorsArr.push(255/255);
			colorsArr.push(36/255);
		}
		else {
			colorsArr.push(nout);
			colorsArr.push(nout);
			colorsArr.push(nout);
		}
		/*let cols = HSVtoRGB(nout, 1, 1)
		colorsArr.push(cols[0]/255);
		colorsArr.push(cols[1]/255);
		colorsArr.push(cols[2]/255);*/
		/*colorsArr.push(nout);
		colorsArr.push(nout);
		colorsArr.push(nout);*/
	}
	console.log(colorsArr);
	let colors = new Float32Array(colorsArr);

	// itemSize = 3 because there are 3 values (components) per vertex
	vertexGeometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
	vertexGeometry.attributes.color.dynamic = true;
	return vertexGeometry;
}

function noiseGen(ix,iy,iz,scale,octaves,persistence) {
	//let heightmap = [...Array(w)].map(i => Array(l));
	let nout = 0;
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