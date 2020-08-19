const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Set canvas width and height
canvas.width = window.innerWidth && document.documentElement.clientWidth
  ? Math.min( window.innerWidth, document.documentElement.clientWidth )
  : window.innerWidth
    || document.documentElement.clientWidth
    || document.getElementsByTagName('body')[0].clientWidth;

canvas.height = window.innerHeight && document.documentElement.clientHeight
  ? Math.min(window.innerHeight, document.documentElement.clientHeight)
  : window.innerHeight
    || document.documentElement.clientHeight
    || document.getElementsByTagName('body')[0].clientHeight;

const tile = new Image();
tile.src = 'tile-grass-long.png';

const nTilesInRow = 256;
const nTilesInColumn = nTilesInRow;
// ratio with : height = 2 : 1
const tWidth = 4;
const tHeight = tWidth * 0.5;

window.onload = () => {
  // origin stores position of the first tile, that is in the middle of y axis and middle of the x axis - half of the map width
  const xOrigin = (canvas.width * 0.5);
  const yOrigin = (canvas.height * 0.5) - ((nTilesInColumn * tHeight) * 0.5);

  // c: column, r: row
  let map = [[]];

  // init map elements
  for( let c = 0; c < nTilesInRow; c++ ) {
    map[ c ] = [];
    for( let r = 0; r < nTilesInColumn; r++ ) {
      map[ c ][ r ] = [];
    }
  };

  // Create function that will allow to itereate all elements of the map
  function mapForEach( callback ) {
    // callback will take item and it's position in the map array
    let c, r;
    for( c = 0; c < nTilesInRow; c++ ) {
      for( r = 0; r < nTilesInColumn; r++ ) {
        callback( map[c][r], c, r )
      }
    };
  }

  
  mapForEach( function( item, c, r ) {
    let w = tWidth * 0.5;
    let h = tHeight * 0.5;

    // 0: x coordinate
    item[0] = xOrigin - w + (c * w) - (r * w);
    // 1: y coord
    item[1] = yOrigin + (c * h) + (r * h);
    // 2: z
    item[2] = 0;
  });

  // calculate image height to match tile's width while keeping the ratio
  const tHeightByRario = ( tWidth * tile.height ) / tile.width;

  // make changes to the map before drawing it
  const seed = Date.now();

  const density = 32;
  const noiseGenerator = openSimplexNoise( seed );
  function generateTerrain( newSeed ) {
    mapForEach( function( item, c, r ) {
      // generate noise value for height of each map tile
      item[ 2 ] = (
        noiseGenerator.noise2D(
          c / density,
          r / density,
          newSeed
        )
      ) * 32;
    });
  }

  function drawTerrain() {
    ctx.clearRect( 0, 0, canvas.width, canvas.height );

    mapForEach( function( item, c, r ) {
      ctx.drawImage(
        tile, item[0], item[1] - item[2],
        tWidth,
        tHeightByRario,
      );
    });
  }

  generateTerrain();
  drawTerrain();

  document.addEventListener( 'keyup', function( event ) {
    // key 32 = spacebar
    if( event.keyCode = 32 ) {
      generateTerrain( 23 );
      drawTerrain();
    }
  });
};
