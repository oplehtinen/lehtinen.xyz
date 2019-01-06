'use strict'
const path = require('path')
const fs = require('fs')

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
                const jpeg = fs.readFileSync(__dirname + '/src/' + pathstring)
                const buffer = jpeg.slice(0,65635)
                const parser = require('exif-parser').create(buffer)
                const result = parser.parse()
                
                const obj = {path: pathstring, metadata: result.tags, size: result.getImageSize()}
                gallery.push(obj)
            }
        })
        fs.writeFile(__dirname + '/galleryhelper.json', JSON.stringify(gallery,null,'\t'), (err) => {
            if (err) throw err;
            console.log('The file has been saved!');
        })
        metalsmith.metadata().gallery = gallery
        done()
    }
}