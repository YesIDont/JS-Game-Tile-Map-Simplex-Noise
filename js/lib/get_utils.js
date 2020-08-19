(function() {

  const getBase = function( querry, parent = document ) {
    return parent.querySelector( querry );
  }

  getBase.id = function( id, parent = document ) {
    return parent.getElementById( id );
  };
  
  getBase.class = function( className, parent = document ) {
    return parent.getElementsByClassName( className );
  };

  getBase.tag = function( tagName, parent = document ) {
    return parent.document.getElementsByTagName( tagName );
  };
  
  getBase.all = function( name, parent = document ) {
    return Array.from( parent.querySelectorAll( name ));
  };

  getBase.windowInnerSize = function() {
    return {
      width: window.innerWidth && document.documentElement.clientWidth
        ? Math.min( window.innerWidth, document.documentElement.clientWidth )
        : window.innerWidth
          || document.documentElement.clientWidth
          || document.getElementsByTagName('body')[0].clientWidth,
  
      height: window.innerHeight && document.documentElement.clientHeight
        ? Math.min(window.innerHeight, document.documentElement.clientHeight)
        : window.innerHeight
          || document.documentElement.clientHeight
          || document.getElementsByTagName('body')[0].clientHeight
    }
  };
  
  getBase.canvasAspectRatio = function( context ) {    
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    const backingStoreRatio = context.webkitBackingStorePixelRatio ||    
      context.mozBackingStorePixelRatio ||    
      context.msBackingStorePixelRatio ||    
      context.oBackingStorePixelRatio ||    
      context.backingStorePixelRatio || 1;
    
    const ratio = devicePixelRatio / backingStoreRatio;  
    return ratio;
  };

  window.get = getBase;

})();
