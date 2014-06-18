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

function cameraMakeReplyCallback(successCallback, errorCallback) {
	return {
		onsuccess: function( reply ) {
			if ( reply.length > 0 ) {
				successCallback( reply[0].value );
			}
			else {
				errorCallback('Picture selection aborted');
			}
		},
		onfail: function() {
			console.log( 'The service launch failed' );
		}
	};
}

function getPicture(cameraSuccess, cameraError, cameraOptions) {
	cameraError = cameraError || function(){};
	var mimeType, serviceId, serviceControl,
		destinationType = args[1],
		sourceType = args[2],
		encodingType = args[5],
		mediaType = args[6];

	// Not supported
	// quality = args[0]
	// targetWidth = args[3]
	// targetHeight = args[4]
	// allowEdit = args[7]
	// correctOrientation = args[8]
	// saveToPhotoAlbum = args[9]

	if (destinationType !== Camera.DestinationType.FILE_URI) {
		errorCallback('DestinationType not supported');
	return;
	}

	if (mediaType !== Camera.MediaType.PICTURE) {
		errorCallback('MediaType not supported');
	return;
	}

	if (encodingType === Camera.EncodingType.JPEG) {
		mimeType = 'image/jpeg';
	}
	else if (encodingType === Camera.EncodingType.PNG) {
		mimeType = 'image/png';
	}
	else {
		mimeType = 'image/*';
	}

	if (sourceType === Camera.PictureSourceType.CAMERA) {
		serviceId = 'http://tizen.org/appcontrol/operation/create_content';
	}
	else {
		serviceId = 'http://tizen.org/appcontrol/operation/pick';
	}

	serviceControl = new tizen.ApplicationControl(
		serviceId,
		null,
		mimeType,
		null );

	tizen.application.launchAppControl(
		serviceControl,
		null,
		null,
		function( error ) {
			errorCallback( error.message );
		},
		cameraMakeReplyCallback( successCallback, errorCallback ) );
}

module.exports = {
	getPicture: getPicture,
	cleanup: function(){}
};

require("cordova/tizen/commandProxy").add("Camera", module.exports);
