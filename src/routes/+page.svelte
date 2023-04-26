<script>
	// @ts-nocheck

	import { onMount } from 'svelte';
	import mapboxgl from 'mapbox-gl';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import backgroundImage from '$lib/bigDesk.png';

	let mapZoom = 0.1;

	export let data;
	const { places } = data;
	let map;
	let response;
	let userWantsToSearch = false;
	let geocoderSearch;
	let h = 0;
	// const bounds = //undefined
	// // set bound to cover the whole world in with, and
	// // the north pole to the south pole in height
	// [
	// 	[-1800.2, 59.765118], // Southwest coordinates
	// 	[1800.2, 5.765118] // Northeast coordinates
	// ];

	// [
	// 	[-18.2, 59.765118], // Southwest coordinates
	// 	[18.2, -.765118] // Northeast coordinates
	// ];

	function toggleSearch() {
		userWantsToSearch = !userWantsToSearch;
		if (geocoderSearch != undefined) {
			geocoderSearch.style.opacity = userWantsToSearch ? 1 : 0;
			geocoderSearch.style.pointerEvents = userWantsToSearch ? 'all' : 'none';

			if (userWantsToSearch) {
				//request focus
				geocoderSearch.querySelector('input').focus();
			} else {
				//remove focus
				geocoderSearch.querySelector('input').blur();
			}
		}
	}

	onMount(async () => {
		//check if user is on dark or light mode
		let isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
		// listen for changes in dark mode
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
			const isDarkMode = e.matches;
			// update the map
			map.setStyle(
				isDarkMode
					? 'mapbox://styles/paalpe/clgl3nlqz00aa01qzfspvcjnr'
					: 'mapbox://styles/paalpe/clgl3nlqz00aa01qzfspvcjnr'
			);
		});

		const startPitch = 10;
		const startBearing = -22;

		mapboxgl.accessToken =
			'pk.eyJ1IjoicGFhbHBlIiwiYSI6ImNrdnNpZXY3cDh6MGgycHF3dHoyNWxmdzcifQ.aYQgLE86cSlGQrQCcmal_Q';
		const map = new mapboxgl.Map({
			container: 'map', // container ID
			style: isDarkMode
				? 'mapbox://styles/mapbox/dark-v11'
				: 'mapbox://styles/paalpe/clgl3nlqz00aa01qzfspvcjnr', //'mapbox://styles/mapbox/streets-v12', // style URL
			center: [5.317055, 59.765118], // starting position [lng, lat]
			zoom: 0.1, // starting zoom
			attributionControl: false,
			// MAKE the map spin but only in one the y axis
			pitch: startPitch,
			bearing: startBearing,

			maxBounds: [
				[-1800.2, 59.765118], // Southwest coordinates
				[1800.2, 5.765118] // Northeast coordinates
			],
			scrollZoom: false,
			dragRotate: false,
			touchZoomRotate: false,
			doubleClickZoom: false

			//
		});

		map.addControl(
			new MapboxGeocoder({
				accessToken: mapboxgl.accessToken,
				mapboxgl: mapboxgl
			})
		);

		// At low zooms, complete a revolution every two minutes.

		let secondsPerRevolution = 100;
		// Above zoom level 5, do not rotate.
		const maxSpinZoom = 4;
		// Rotate at intermediate speeds between zoom levels 3 and 5.
		const slowSpinZoom = 3;

		let userInteracting = false;
		let spinEnabled = true;

		//  mapZoom = map.getZoom();

		function spinGlobe() {
			const zoom = map.getZoom();
			const pitch = map.getPitch();
			const bearing = map.getBearing();

			if (spinEnabled && !userInteracting && zoom < maxSpinZoom) {
				// if (bearing != startBearing) {
				// 	map.easeTo({ bearing: startBearing, duration: 1000, easing: (n) => n });
				// }
				// if (pitch != startPitch) {
				// 	map.easeTo({ pitch: startPitch, duration: 1000, easing: (n) => n });
				// }
				if (pitch != startBearing || bearing != startBearing) {
					// map.jumpTo({ bearing: startBearing, pitch: startPitch });
				}

				let distancePerSecond = 360 / secondsPerRevolution;
				if (zoom > slowSpinZoom) {
					// Slow spinning at higher zooms
					const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
					distancePerSecond *= zoomDif;
				}
				const center = map.getCenter();
				center.lng -= distancePerSecond;
				// Smoothly animate the map over one second.
				// When this animation is complete, it calls a 'moveend' event.
				// map.to

				map.easeTo({ center, duration: 1000, easing: (n) => n });
			} else if (!userInteracting && zoom >= maxSpinZoom) {
				// if (bearing > 0) {
				// map.snapToNorth({ duration: 200, easing: (n) => n });
				// map.easeTo({ bearing: 0, duration: 600, easing: (n) => n });
				// }
				// if (pitch > 0) {
				// 	map.easeTo({ pitch: 0, duration: 1000, easing: (n) => n });
				// }
			}
		}

		// spin on mouse exit
		// map.on('mouseleave', () => {
		// 	console.log('mouse left');
		// 	spinEnabled = true;
		// 	userInteracting = false;
		// 	spinGlobe();
		// });

		// Pause spinning on interaction
		map.on('mousedown', () => {
			userInteracting = true;
		});

		// // Restart spinning the globe when interaction is complete
		map.on('mouseup', () => {
			userInteracting = false;
			spinGlobe();
		});

		// enable touch pan
		map.on('touchstart', () => {
			userInteracting = true;
		});

		map.on('touchend', () => {
			userInteracting = false;
			// spinGlobe();
		});

		// // position of click on map
		map.on('click', (e) => {
			// fly to location
			if (map.getZoom() < 1) {
				map.scrollZoom.enable();
				map.touchZoomRotate.enable();
				map.setMaxBounds(undefined);
				// map.setPitch(0);
				// map.setBearing(0);

				map.flyTo({
					center: e.lngLat,
					speed: 0.6,
					curve: 1,
					zoom: 6.2,
					pitch: 0,
					bearing: 0
				});
				setTimeout(() => {
					map.setMinZoom(1.1);
				}, 2000);
			}
		});

		// These events account for cases where the mouse has moved
		// off the map, so 'mouseup' will not be fired.
		// map.on('dragend', () => {
		// 	// userInteracting = false;
		// 	spinGlobe();
		// });
		map.on('pitchend', () => {
			userInteracting = false;
			spinGlobe();
		});
		map.on('rotateend', () => {
			userInteracting = false;
			spinGlobe();
		});

		// // When animation is complete, start spinning if there is no ongoing interaction
		map.on('moveend', () => {
			spinGlobe();
		});

		map.on('zoom', () => {
			const newZoom = map.getZoom();
			if (newZoom < 4) {
				// toggle visibility of markerLayer
			}
			mapZoom = newZoom;
		});

		spinGlobe();

		// style the geocoder
		geocoderSearch = document.querySelector('.mapboxgl-ctrl-geocoder');
		geocoderSearch.style.opacity = 0.0;
		geocoderSearch.style.pointerEvents = 'none';
		geocoderSearch.style.transition = 'opacity 0.1s ease-in-out';

		// for each result in places.results
		for (const page of places.results) {
			// if page has a property called Name
			if (page.properties.coordinates.rich_text[0] != undefined) {
				console.log(page.properties);
				const title = page.properties.Name.title?.[0]?.plain_text ?? '';
				const coordinates = page.properties.coordinates.rich_text?.[0]?.plain_text;
				const icon = page.icon.emoji;

				let Tags = [];

				if (page.properties.Tags.multi_select != undefined) {
					for (const tag of page.properties.Tags.multi_select) {
						// Tags.push({ 'name: tag.name, color: tag.color' });
						Tags.push(`
						<div style = "display:inline">
						<code class="tag" style="position: absolute; background-color: ${tag.color}; opacity:.3   ">${tag.name}</code>
						<code class="tag" style=" position: absolute; background-color: transparent; color:${tag.color}; filter: brightness(75%);">${tag.name}</code>

						</div>
						`);
					}
				}

				console.log(title);
				if (title && coordinates) {
					// split the coordinates into an array
					const [lat, lng] = coordinates.replace(' ', '').split(',');
					const emoji = document.createElement('div');
					// emoji.style = 'background-color: white; border-radius: 50%; width: 42px; height: 42px; display: flex; justify-content: center; align-items: center;';
					emoji.textContent = icon ?? '🏠';
					emoji.style.fontSize = '30px';
					emoji.style.marginTop = '-15px';

					// add onclick event to the marker
					emoji.onclick = () => {
						const _mapZoom = map.getZoom();
						console.log('clicked');
						emoji.textContent = '·';
						userInteracting = true;
						map.flyTo({
							center: [lng, lat],
							speed: 0.6,
							curve: 1,
							zoom: _mapZoom < 6.2 ? 6.2 : _mapZoom,
							pitch: 0,
							bearing: 0
						});
					};

					// Create a default Marker and add it to the map.
					const marker1 = new mapboxgl.Marker(emoji)
						.setLngLat([lng, lat])
						.setPopup(
							new mapboxgl.Popup({ offset: 25, closeButton: false }) // add popups
								.setHTML(
									`<article style="margin:0; min-width: 150px;">
									<h2 style="padding=0; marging=0;"> ${icon} </h2> <h4 style="padding-top=0; marging-top=0;"> ${title} </h4>
									${Tags.join(' ')}
									
									</article>`
									// Her står det noe!
									// <code>🚀 Test</code> <code>🙊 Test</code>
								)
						)
						.addTo(map);

					marker1.getPopup().on('close', () => {
						emoji.textContent = icon ?? '🏠';
						userInteracting = false;
					});
				}
			}
		}
	});
</script>

<!-- head -->
<svelte:head>
	<link href="https://api.mapbox.com/mapbox-gl-js/v2.14.0/mapbox-gl.css" rel="stylesheet" />
	<script
		src="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.min.js"
	></script>
	<link
		rel="stylesheet"
		href="https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-geocoder/v5.0.0/mapbox-gl-geocoder.css"
		type="text/css"
	/>
</svelte:head>

<body style="height: 100%; overflow-y: clip; overflow-x: clip; ">
	<!-- {#each places.results as page}
		{#if page.properties.Name.title}
			<h2>{page.properties.Name.title?.[0]?.plain_text ?? 'Tittel'}</h2>
		{/if}
	{/each} -->
	<!-- <div id="drag" bind:this={area} />
	<Motion
	whileHover={{scale:1.05}}
		drag={userWantsToSearch}
		dragConstraints={{ current: area }}
		let:motion
	>
		<div id="map" use:motion />
	</Motion> -->
	<!-- <svg id="background"  width="426" height="494" viewBox="0 0 426 494" fill="none" xmlns="http://www.w3.org/2000/svg">
		<path d="M272.452 83.0683C293.181 28.3726 344.873 60.2784 368.127 83.0683C379.588 83.0683 406.497 74.0536 422.443 37.995C442.375 -7.07827 264.977 0.0119067 230.095 7.60853C195.214 15.2051 174.285 122.571 125.949 138.777C77.6127 154.983 175.78 348.95 174.285 419.852C172.79 490.754 29.2766 395.543 4.85939 448.719C-19.5578 501.895 117.477 491.767 222.621 490.247C306.735 489.032 382.578 442.811 409.985 419.852L356.666 403.139C350.52 413.775 321.087 434.741 252.519 433.526C166.81 432.006 241.557 385.92 199.2 277.542C156.844 169.163 246.54 151.438 272.452 83.0683Z" fill="#513B04" stroke="black" stroke-width="4"/>
		</svg> -->

	<!-- Show this image /Users/paal/PanterDev/1svelte/List-n-Up/src/lib/desk.png -->
	<!-- <Motion let:motion whileHover={{ scale: 1.02 }}> -->
	{#if h != 0}
		<div style="overflow-y: hidden;">
			<img
				src={backgroundImage}
				alt="A desk with a globe on it. Books all around."
				id="picture"
				style="opacity:{1 - mapZoom / 3}; top: 50%;
				overflow-y: hidden;
			left: 50%;
			transform: translate(-49%, -45%) scale({mapZoom * 0.56 + 0.52 + h * 0.0003});
		
			"
			/>
		</div>
	{/if}

	<div bind:clientHeight={h} id="map" class="dark" />
	<!-- </Motion> -->

	<div id="footer">
		<p style="font-family: monospace; font-weight: 600; color: wheat;">
			22. April 2022 - Pål Sørvik Pedersen - V.0.01
		</p>
		<!-- <button class:active={userWantsToSearch} on:click={() => toggleSearch()}>Søk</button> -->
	</div>

	<!--  add back arrow top left corner -->
</body>

<style>
	#picture {
		position: absolute;
		z-index: -100;
		overflow: clip;
		object-fit: contain;
		overflow-y: hidden;
		max-width: none;
	}

	#map {
		height: 100%;
		width: 100%;
		top: 0;
		left: 0;
		position: absolute;
		/* zz-index: -200; */
	}

	#footer {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 30px;
		display: flex;
		justify-content: center;
		align-items: center;
		/* background-color: white; */
	}
</style>
