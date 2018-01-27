require('blueimp-gallery/css/blueimp-gallery.css');
require('../css/style.scss');

$ = require('jquery');
require('scrollstory/jquery.scrollstory.js');

$.fn.moveIt = function(){
  var $window = $(window);
  var instances = [];
  
  $(this).each(function() {
    instances.push(new MoveItItem($(this)));
  });
  
  window.addEventListener('scroll', function(){
    const scrollTop = $window.scrollTop();
    instances.forEach(function(inst){
      inst.update(scrollTop);
    });
  }, {passive: true}); // TODO check compatibility
}

const MoveItItem = function(el){
  this.el = $(el);
  this.container = this.el.parent('.part');
  this.speed = parseInt(this.el.attr('data-scroll-speed'));
};

MoveItItem.prototype.update = function(scrollTop){
  const top = scrollTop - this.container.offset().top;
  this.el.css('transform', 'translateY(' + -(top / this.speed) + 'px)');
};

const stickybits = require('stickybits/src/jquery.stickybits');
const blueimp = require('blueimp-gallery/js/blueimp-gallery');
const videoMedia = require('./media/video');
const imageMedia = require('./media/images');

const $story = $('#scrollytelling');
const scrollStory = $story.scrollStory({
  contentSelector: '.part'
}).data('plugin_scrollStory');

const LOADED_STORY_SECTIONS = [];
let isSoundEnabled = true;


function loadItem (item) {
  // have to load videos as we remove the src and reload to prevent downloading unwatched media.
  if (item.data.video) {
    videoMedia.insertBackgroundVideo(
      item.el,
      item.index,
      [
        {
          type: 'video/mp4',
          src: item.data.mp4
        },
        {
          type: 'video/webm',
          src: item.data.webm
        }
      ],
      {
        poster: item.data.poster,
        autoplay: item.data.autoplay,
        muted: (isSoundEnabled === false) || (item.data.muted === true),
        loop: item.data.loop
      }
    );
  }

  if (LOADED_STORY_SECTIONS[item.index] !== undefined) {
    return;
  }

  if (item.data.image) {
    imageMedia.insertBackgroundImage(item.el, item.data.src, false);
  }

  if (item.data.slideshow) {
    blueimp(
      item.el.find('.slide-container a').get(),
      {
        container: item.el.find('.blueimp-gallery')[0],
        carousel: true,
        titleElement: '.slide-caption',
        startSlideshow: false,
        onslide: function (index, slide) {
          const text = this.list[index].getAttribute('data-credits');
          const node = this.container.find('.credits');
          node.empty();
          if (text) {
            node[0].appendChild(document.createTextNode(text));
          }
        }
      }
    );
  }

  if (item.data.slides) {
    item.el.find('.bg-image')
      .each(function(i) {
        const $el = $(this);
        $el.css('background-image', `url(${$el.data('src')})`);
      })
      .stickybits();
  }

  if (item.data.parallax) {
    item.el.find('.bg-image').css('background-image', `url(${item.data.src})`);
  }

  LOADED_STORY_SECTIONS[item.index] = {
    loaded: true
  };
}

$story.on('itemfocus', function(ev, item) {
  console.log('itemfocus');
  console.log(item);
  if (item.data.image) {
    imageMedia.fixBackgroundImage(item.el, item.data.src, true);
  }

  if (item.data.video) {
    videoMedia.fixBackgroundVideo(item.el);
  }
});

$story.on('itemblur', function(ev, item) {
  console.log('itemblur');
  console.log(item);

  if (item.data.image) {
    imageMedia.unfixBackgroundImage(item.el);
  }

  if (item.data.video) {
    videoMedia.unfixBackgroundVideo(item.el);
  }
});

$story.on('itementerviewport', function(ev, item) {
  console.log('itementerviewport');
  console.log(item);
  loadItem(item);
});

$story.on('itemexitviewport', function(ev, item) {
  console.log('itemexitviewport');
  console.log(item);

  if (item.data.image) {
    imageMedia.unfixBackgroundImage(item.el);
  }

  if (item.data.video) {
    const data = videoMedia.removeBackgroundVideo(item.el, item.index);
  }
});

scrollStory.getItemsInViewport().forEach(function (item) {
  loadItem(item);
});

$('[data-scroll-speed]').moveIt();

$('.mute').click(function () {
  $this = $(this);
  if ($this.hasClass('muted')) {
    isSoundEnabled = true;
    $this.removeClass('muted');
  } else {
    isSoundEnabled = false;
    $this.addClass('muted');
  }

  scrollStory.getItemsInViewport().forEach(function (item) {
    if (item.data.video) {
      const muted = (isSoundEnabled === false) || (item.data.muted === true);
      videoMedia.setMuted(item.index, muted);
    }
  });
});
