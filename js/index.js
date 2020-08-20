window.addEventListener( 'load', function() {

  const log = console.log;

  /**
   * PIXI.js settings
  */

  const Pixi = PIXI;
  const GraphicsEngine = Pixi.Application;
  const Container = Pixi.Container;
  const Sprite = Pixi.Sprite;
  const Loader = new Pixi.Loader();  
  const Graphics = new GraphicsEngine({ autoResize: true, transparent: true });
  const Renderer = Graphics.renderer;
  const Screen = Renderer.screen;
  const Stage = Graphics.stage;
  const Simulation = new Container();
  
  document.body.appendChild( Graphics.view );
  
  function UpdateRendereSize() {
    Renderer.resolution = get.canvasAspectRatio( Renderer.context );
    const { width, height } = get.windowInnerSize();
    Renderer.resize( width, height );
  };
  
  UpdateRendereSize();
  window.addEventListener( 'resize', UpdateRendereSize );  
  
  Stage.addChild( Simulation );
  Simulation.transparent = true;
  Simulation.zIndex = 20;
  Simulation.width = Screen.width;
  Simulation.height = Screen.height;

  Stage.sortableChildren = true;
  Graphics.stop();  
  Loader.add( 'grass', 'img/tile-grass-long_s.png' );

  
  function AssetsPostLoadActions( loader, resources ) {

    const nTilesInRow = 128;
    const nTilesInColumn = nTilesInRow;
    // Check which canvas side is shorter and use it as square side
    const canvasShortSide = Math.min( Screen.width, Screen.height );
    const canvasLongSide = Math.max( Screen.width, Screen.height );  
    const tWidth = Math.floor( canvasShortSide / nTilesInRow );
    const tHeight = tWidth * 0.5;  
    // Origin stores position of the first tile, that sits in the middle of y axis and middle of the x axis - half of the map width
    const xOrigin = ( Screen.width * 0.5 ) + ( tWidth * 0.5 );
    const yOrigin = ( Screen.height * 0.5 ) - (( nTilesInColumn * tHeight ) * 0.5);
    const grassTexture = resources[ 'grass' ].texture;  
    const baseText = grassTexture.baseTexture;
    // Calculate image height to match tile's width while keeping the ratio
    const tileHeightByRario = ( tWidth * baseText.height ) / baseText.width;
    const uiFPSDisplay = get( '.fps span' );
    const UI = get( '.UI' );
    const uiTools = get( '.UI-tools' );
    const uiSwitch = get( '.UI-switch' );
    const uiWaveSpeedSlider = get( '.wave-speed input' );
    const uiWaveSpeedValue = get( '.wave-speed span' );
    const uiWaveHeightSlider = get( '.wave-height input' );
    const uiWaveHeightValue = get( '.wave-height span' );
    const uiWaveLengthSlider = get( '.wave-length input' );
    const uiWaveLengthValue = get( '.wave-length span' );
    const uiRoundSamples = get( '.plateau-round' );

    // c = column, r = row
    let c, r;
    let deltaOffset = 10;length
    let height = 60;
    let lastTime = 0;
    let map = [[]];
    let noiseZoomMultiplier = 10;
    let noiseZoom = tWidth / tHeight * noiseZoomMultiplier;
    let offsetCounter = 0;
    let sin = 0;
    let shouldRoundSamples = false;

    noise.seed(Date.now())

    rangesliderJs.create(get.all( 'input[type="range"]' ));

    uiSwitch.onclick = function() { 
      const isVisible = uiTools.getAttribute( 'data-visible' );
      if( isVisible === 'true' ) {
        uiTools.style.transform = 'translate(450px, 0)';
        uiTools.setAttribute( 'data-visible', 'false' );
      }
      else {
        uiTools.style.transform = 'translate(0, 0)';
        uiTools.setAttribute( 'data-visible', 'true' );
      }
    };

    uiWaveSpeedSlider.oninput = function( event ) {
      const { value } = event.target;
      uiWaveSpeedValue.innerHTML = value;
      deltaOffset = value;
    };

    uiWaveHeightSlider.oninput = function( event ) {
      const { value } = event.target;
      uiWaveHeightValue.innerHTML = value;
      height = value;
    };

    uiWaveLengthSlider.oninput = function( event ) {  
      const { value } = event.target;
      uiWaveLengthValue.innerHTML = value;
      noiseZoomMultiplier = value;
      noiseZoom = tWidth / tHeight * noiseZoomMultiplier;
    };

    uiRoundSamples.onchange = function( event ) {
      shouldRoundSamples = event.target.checked;
    }; 

    // Init map and fill it with Pixi.js sprites
    for( c = 0; c < nTilesInRow; c++ ) {
      map[ c ] = [];
      for( r = 0; r < nTilesInColumn; r++ ) {
        let w = tWidth * 0.5;
        let h = tHeight * 0.5;
        
        const tile = new Sprite( grassTexture );
        tile.anchor.set( 0.5 );
        tile.x = xOrigin - w + (c * w) - (r * w);
        tile.y = yOrigin + (c * h) + (r * h);
        tile.yBuff = tile.y;
        tile.width = tWidth;
        tile.height = tileHeightByRario;

        tile.y = (
          noise.simplex2(
            c / noiseZoom,
            r / noiseZoom
          )
        ) * height + tile.yBuff;

        Simulation.addChild( tile );
        map[ c ][ r ] = tile;
      }
    };   

    function updateFrame( deltaSeconds ) {
      const now = Date.now();
      uiFPSDisplay.innerHTML = Math.ceil( 1000 / (now - lastTime) );
      lastTime = Date.now();
      offsetCounter += deltaSeconds ? deltaSeconds * deltaOffset / 1000 : ( deltaOffset / 1000 );

      if( shouldRoundSamples ) {
        // sin = Math.sin(now)
        // height = 32 + sin * 2;
        for( c = 0; c < nTilesInRow; c++ ) {
          for( r = 0; r < nTilesInColumn; r++ ) {
            let noiseSample = noise.perlin2(
              c / noiseZoom + offsetCounter,
              r / noiseZoom + offsetCounter
            );

            // scale sample from range -1 to 1 to 0 to 1
            noiseSample = Math.ceil( noiseSample );

            noiseSample *= height;
            noiseSample += map[c][r].yBuff;
            map[c][r].y = noiseSample;
          }
        };
        return;
      };

      // sin = Math.sin(now)
      // height = 32 + sin * 2;
      for( c = 0; c < nTilesInRow; c++ ) {
        for( r = 0; r < nTilesInColumn; r++ ) {
          map[c][r].y = noise.perlin2(
            c / noiseZoom + offsetCounter,
            r / noiseZoom + offsetCounter
          ) * height + map[c][r].yBuff;
        }
      };
    };  
  
    Graphics.ticker.add( updateFrame ); 
    Graphics.start();
  };

  Loader.load( AssetsPostLoadActions );
});  

