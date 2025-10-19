// Renderer Object
// canvas: 			Canvas Element
// height: 			Screen height
// width: 			Screen width
// iFocalLength:	FocalLength input element
// iNumberSteps: 	NumberSteps input element
// iEpsilon: 		Epsilon input element

function Renderer(canvas, height, width, iFocalLength, iEpsilon){
    // Init WebGL-Renderer
    this.canvas = canvas;
    this.height = height;
    this.width = width;
    this.canvas.height = this.height;
    this.canvas.width = this.width;
	this.gl = this.canvas.getContext("experimental-webgl");
	if(!this.gl) this.gl = this.canvas.getContext("webgl");;
	if(!this.gl) {console.log("Error: Unable to initialise WebGL");return;}

	// Init GLSL Program
    var vertexShaderSource = this.getShaderSourceFromScript("vertexShader");
	var fragmentShaderSource = this.getShaderSourceFromScript("fragmentShader");

	var vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
	this.program = this.createProgram(vertexShader, fragmentShader);
	this.gl.useProgram(this.program);

	// Create Quad
	this.createQuad();

	// Init Controls
	this.controls = new Controls(
		this.canvas,
		this.update.bind(this)
	);

	// Init Input Fields
	this.iFocalLength = iFocalLength;
    this.iFocalLength.min = 0.1;
    this.iFocalLength.max = 10;
    this.iFocalLength.step = 0.1;

    this.iEpsilon = iEpsilon;
    this.iEpsilon.min = 0.00001;
    this.iEpsilon.max = 0.01;
    this.iEpsilon.step = 0.00001;

    // Init Camera Paramters and render
    this.resetCameraParameters();
}

// Reset camera paramters to initial values
Renderer.prototype.resetCameraParameters = function(){
	this.iFocalLength.value = 2;	// Distance between the eye and the image plane
	this.iEpsilon.value = 0.0001; 	// Surface Threshold
	this.update();
}

// Update Screen
Renderer.prototype.update = function(){
	// Update Uniforms
	this.updateUniforms();

	// Render Scene
	this.render();
}

// Store current unfiforms in shader
Renderer.prototype.updateUniforms = function() {
	var camUp = this.controls.camUp;
	var camRight = this.controls.camRight;
	var camForward = this.controls.camForward;
	var eye = this.controls.eye;
	this.gl.uniform3f(this.program.uCameraUpLoc, camUp[0], camUp[1], camUp[2]);
	this.gl.uniform3f(this.program.uCameraRightLoc, camRight[0], camRight[1], camRight[2]);
	this.gl.uniform3f(this.program.uCameraForwardLoc, camForward[0], camForward[1], camForward[2]);
	this.gl.uniform3f(this.program.uCameraEyeLoc, eye[0], eye[1], eye[2]);
	this.gl.uniform1f(this.program.uCameraAspectRatioLoc, this.width/this.height);
	this.gl.uniform1f(this.program.uCameraFocalLengthLoc, this.iFocalLength.value);
	this.gl.uniform1f(this.program.uSettingsEpsilonLoc, this.iEpsilon.value);
	this.gl.uniform2f(this.program.uSettingsResolutionLoc, this.width, this.height);

    this.gl.uniform3f(this.gl.getUniformLocation(this.program,"uLights[0].position"), 1, 10, -1 );
    this.gl.uniform3f(this.gl.getUniformLocation(this.program,"uLights[0].color"), 1, 1, 1 );
    this.gl.uniform3f(this.gl.getUniformLocation(this.program,"uLights[1].position"), -10, 10, 10 );
    this.gl.uniform3f(this.gl.getUniformLocation(this.program,"uLights[1].color"), 1, 1, 1 );
}

// Renders the Scene
Renderer.prototype.render = function(){
	this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
}

// Update canvas size
Renderer.prototype.updateSize = function(height, width){
	this.height = height;
    this.width = width;
    this.canvas.height = this.height;
    this.canvas.width = this.width;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.update();
}

// Create Shader program
Renderer.prototype.createProgram = function(vertexShader, fragmentShader) {
	// Init Program
    var program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    // Check link status
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        console.log("Error: Unable to Link Shader", this.gl.getProgramInfoLog(program));
        this.gl.deleteProgram(program);
        return null;
    }

    // Get Location of Uniforms
	program.uCameraUpLoc = this.gl.getUniformLocation(program, "uCamera.up");
	program.uCameraRightLoc = this.gl.getUniformLocation(program, "uCamera.right");
	program.uCameraForwardLoc = this.gl.getUniformLocation(program, "uCamera.forward");
	program.uCameraEyeLoc = this.gl.getUniformLocation(program, "uCamera.eye");
	program.uCameraAspectRatioLoc = this.gl.getUniformLocation(program, "uCamera.aspectRatio");
	program.uCameraFocalLengthLoc = this.gl.getUniformLocation(program, "uCamera.focalLength");

	program.uSettingsEpsilonLoc = this.gl.getUniformLocation(program, "uSettings.epsilon");
	program.uSettingsResolutionLoc = this.gl.getUniformLocation(program, "uSettings.resolution");

    return program;
}

Renderer.prototype.loadShaderSource = function(path) {

    var xhr = new XMLHttpRequest();
		xhr.overrideMimeType("x-shader/x-fragment");
    xhr.open( "get", path, false );
    xhr.send();

    var source = xhr.responseText;

    return source;
}


// Obtain the the source code of a shader from an element
Renderer.prototype.getShaderSourceFromScript = function(scriptId) {

    var shaderScript = document.getElementById(scriptId);
    if (!shaderScript){console.log("Error: Unable to load Shader-Script",scriptId);return;}

    return shaderScript.text;
}

// Create Shader
Renderer.prototype.createShader = function(shaderType,source) {

	// Create shader object
    var shader = this.gl.createShader(shaderType);

    // Load shader source
    this.gl.shaderSource(shader, source);

    // Compile shader
    this.gl.compileShader(shader);

    // Check compile status
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.log("Error: Shader does not compile",this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
}

// Create view screen
Renderer.prototype.createQuad = function(){
	// get location of aVertexPosition
	var aVertexPositionLoc = this.gl.getAttribLocation(this.program, "aVertexPosition");

	// Create Quad
	var buffer = this.gl.createBuffer();
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
	this.gl.bufferData(
	    this.gl.ARRAY_BUFFER,
	    new Float32Array([
	        -1.0, -1.0, 0.0,
	        -1.0,  1.0, 0.0,
	         1.0, -1.0, 0.0,
	         1.0,  1.0, 0.0]),
	    this.gl.STATIC_DRAW
    );
    this.gl.enableVertexAttribArray(aVertexPositionLoc);
	this.gl.vertexAttribPointer(aVertexPositionLoc, 3, this.gl.FLOAT, false, 0, 0);
}