'use strict'
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')
const mkdirp = require('mkdirp')

module.exports = gallery

function gallery(func) {
    const gallery = []
    return function(files, metalsmith, done) {
        // setImmediate(done)
        const keys = Object.keys(files)

        keys.forEach((file) => {
            //console.log(path.parse(file))
            const imgpath = path.parse(file)
 
            if (imgpath.dir === 'gallery') {
                const pathstring = '/' + imgpath.dir + '/' + imgpath.base
                const thumbstring = '/' + imgpath.dir + '/preview/' + imgpath.name
                const jpeg = fs.readFileSync(__dirname + '/src/' + pathstring)
                mkdirp(__dirname + '/src/' + imgpath.dir + '/preview/')
                sharp(jpeg)
                    .resize({width:350})
                    .toFile(__dirname + '/src/' + imgpath.dir + '/preview/' + imgpath.base)
                sharp(jpeg)
                    .resize({width:350})
                    .webp()
                    .toFile(__dirname + '/src/' + imgpath.dir + '/preview/' + imgpath.name + '.webp').then(function(){
                        
                    })
                //console.log(imgpath)
                const thumb = fs.readFileSync(__dirname + '/src/' + imgpath.dir + '/preview/' + imgpath.base)
                const thumbBuffer = thumb.slice(0,65635)
                const buffer = jpeg.slice(0,65635)
                const parser = require('exif-parser').create(buffer)
                const thumbparser = require('exif-parser').create(thumbBuffer)
                const result = parser.parse()
                const thumbInfo = thumbparser.parse()
                const obj = {path: pathstring, thumbpath: thumbstring, metadata: result.tags, thumbSize: thumbInfo.getImageSize(), size: result.getImageSize()}
                gallery.push(obj)
            }
        })
        fs.writeFile(__dirname + '/galleryhelper.json', JSON.stringify(gallery,null,'\t'), (err) => {
            if (err) throw err;
        })
        metalsmith.metadata().gallery = gallery
        done()
    }
}