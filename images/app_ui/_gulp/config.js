var src  = 'src/';
var dest = './';

var config = {
  src: {
    styles:     src + '/scss',
    scripts:    src + '/js',
    media:      src + '/img',
    fonts:      src + '/font'
  },

  dest: {
    root:       dest,
    styles:     dest + '/css',
    scripts:    dest + '/js',
    media:      dest + '/img',
    fonts:      dest + '/font'
  },

  banner: '/*!\n * <%= filename %> \n * <%= pkg.name %> v<%= pkg.version %>\n * <%= pkg.homepage %>\n * Copyright (c) Oracle\n*/\n\n'
}

module.exports = config;

pkg  = require('../package.json');
