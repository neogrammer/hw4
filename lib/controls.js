function Controls(container, callback){

	this.container = container;
	this.callback = callback;

	// Init Camera
	this.eye;
	this.camUp;
	this.camRight;
	this.camForward;

	this.horizontalAngle;
	this.verticalAngle;

	this.temp = {x:0,y:0};

	this.active = false;
	this.mode=0;

	var scope = this;

	function reset(){
		if(scope.active) onMouseUp();
		scope.horizontalAngle = 0;
		scope.verticalAngle = 0;
		scope.eye = [0, 0.5, -2];
		scope.camUp = [0, 1, 0];
		scope.camRight = [1, 0, 0];
		scope.camForward = vec3.create();
		vec3.cross(scope.camForward, scope.camRight, scope.camUp);
		vec3.normalize(scope.camForward, scope.camForward);
	}

	reset();

	function onMouseDown(event){
		event.preventDefault();
		if(scope.active) return;

		if(event.button === 0 || event.button === 2){
			scope.active = true;
			scope.mode = event.button;
			scope.temp.x = event.clientX;
			scope.temp.y = event.clientY;
			scope.container.addEventListener( 'mouseup', onMouseUp, false );
			scope.container.addEventListener( 'mouseout', onMouseUp, false );
			scope.container.addEventListener( 'mousemove', onMouseMove, false );
		}
	}

	function onMouseUp(event){
		scope.container.removeEventListener( 'mouseup', onMouseUp, false );
		scope.container.removeEventListener( 'mouseout', onMouseUp, false );
		scope.container.removeEventListener( 'mousemove', onMouseMove, false );
		scope.active = false;
	}

	function cameraZoom(event){
		var moveSpeed = 0.1;
		var dir;
		var delta = 0;
		if ( event.wheelDelta !== undefined ) { // WebKit / Opera / Explorer 9
			delta = event.wheelDelta;
		} else if ( event.detail !== undefined ) { // Firefox
			delta = - event.detail;
		}

		if(delta>0)
			dir= 1;
		else
			dir=-1;

		scope.eye[0] += scope.camForward[0] * moveSpeed * dir;
		scope.eye[1] += scope.camForward[1] * moveSpeed * dir;
		scope.eye[2] += scope.camForward[2] * moveSpeed * dir;

		scope.callback();
	}

	function onMouseMove(event){
		var moveSpeed = 0.005;
		var deltaX = (event.clientX - scope.temp.x)*moveSpeed;
		var deltaY = (event.clientY - scope.temp.y)*moveSpeed;
		scope.temp.x = event.clientX;
		scope.temp.y = event.clientY;

		if(scope.mode===0){
			// Pan Mode
			scope.eye[0] += scope.camRight[0] * deltaX;
			scope.eye[1] += scope.camRight[1] * deltaX;
			scope.eye[2] += scope.camRight[2] * deltaX;

			scope.eye[0] -= scope.camUp[0] * deltaY;
			scope.eye[1] -= scope.camUp[1] * deltaY;
			scope.eye[2] -= scope.camUp[2] * deltaY;
		} else if(scope.mode===2){
			// Rotate Mode
			scope.horizontalAngle += deltaX;
			scope.verticalAngle += deltaY;

			// Update camera vectors
			var sintheta = Math.sin(scope.horizontalAngle);
			var costheta = Math.cos(scope.horizontalAngle);
			var sinphi = Math.sin(scope.verticalAngle);
			var cosphi = Math.cos(scope.verticalAngle);
			scope.camForward = [cosphi * sintheta, -sinphi, cosphi * costheta];
			scope.camRight = [costheta, 0.0, -sintheta];
			vec3.cross(scope.camUp, scope.camForward, scope.camRight);
			vec3.normalize(scope.camUp, scope.camUp);
		}
		scope.callback();
	}

	function onKeyDown(event){
		// If Spacebar was pressed reset Camera
		if(event.keyCode===32){
			reset();
			scope.callback();
		}
	}

	// Init Handlers
	this.container.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
	this.container.addEventListener( 'mousewheel', cameraZoom, false );
	this.container.addEventListener( 'DOMMouseScroll', cameraZoom, false ); // firefox
	this.container.addEventListener( 'mousedown', onMouseDown, false );
	document.addEventListener( 'keydown', onKeyDown, false );
}