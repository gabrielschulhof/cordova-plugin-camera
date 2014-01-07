/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

( function() {
var Camera = require('org.apache.cordova.camera.Camera'),

	// Evil hack to attempt to identify if the user cancels out of the camera app:
	// 1. Attach to document.blur - assuming the appearance of the camera app
	//    causes a blur event to be received by whatever element caused
	//    getPicture to be called
	// 2. Upon receipt of blur, record the target of the event and attach to
	//    focus - assuming the same element receives focus when the camera app
	//    is closed, and that onsuccess/onerror gets called /before/ the focus
	//    handler fires
	// 3. When focus fires, call @cancel, which is a callback passed into
	//    createCancelHack
	createCancelHack = function( cancel ) {
		var targetElement,
			focusListener = function( event ) {

				// Only call cancel() if the focus is on the same element as the
				// blur we received earlier
				if ( event.target === targetElement ) {
					cancel();
				}
				remove();
			},
			blurListener = function( event ) {
				targetElement = event.target;
				targetElement.addEventListener( "focus", focusListener, true );
			},
			remove = function() {
				if ( targetElement ) {
					targetElement.removeEventListener( "focus", focusListener, true );
				}
				document.removeEventListener( "blur", blurListener, true );
			};

		document.addEventListener( "blur", blurListener, true );

		return remove;
	},

	// Process picture path returned by camera based on arguments
	processPictureFromFile = function( successCallback, errorCallback, arguments, path ) {
		if ( path ) {
			if ( arguments.destinationType === Camera.FILE_URI ) {
				path = "file://" + path;
			}
		}
		successCallback( path );
	};

module.exports = {
	takePicture: function( successCallback, errorCallback, arguments ) {
// The meaning of @arguments:
//			keys = [
//				0:"quality", 1:"destinationType", 2:"sourceType", 3:"targetWidth",
//				4: "targetHeight", 5: "encodingType", 6: "mediaType", 7: "allowEdit",
//				8: "correctOrientation", 9: "saveToPhotoAlbum", 10: "popoverOptions",
// 				11: "cameraDirection"
//			];

		var serviceControl = new tizen.ApplicationControl(
			( "http://tizen.org/appcontrol/operation/" +
				( arguments[ 2 ] === Camera.PictureSourceType.CAMERA ?
				"create_content": "pick" ) ),
			null, "image/*", null ),
			launchAppSuccess = function() {},
			launchAppError = function( error ) {
				removeCancelHack();
				errorCallback( ( "message" in error ) ? error.message : error );
			},
			removeCancelHack = createCancelHack( function() {
				processPictureFromFile( successCallback, errorCallback, arguments, null );
			});

		tizen.application.launchAppControl( serviceControl, null,
			launchAppSuccess, launchAppError, {
				onsuccess: function( data ) {
					removeCancelHack();
					if ( data && data.length > 0 &&
						data[ 0 ].key === "http://tizen.org/appcontrol/data/selected" &&
						( "value" in data[ 0 ] ) &&
						data[ 0 ].value.length > 0 ) {
						processPictureFromFile( successCallback, errorCallback, arguments,
							data[ 0 ].value[ 0 ] );
					} else {
						errorCallback( "Reply from camera app does not meet expectations!" );
					}
				},
				onerror: function( error ) {
					removeCancelHack();
					errorCallback( ( message in error ) ? error.message : error );
				}
			});
	},
	cleanup: function(){}
};

require("cordova/tizen/commandProxy").add("Camera", module.exports);

})();
