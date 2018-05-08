var webshot = require('webshot')
var fs = require('fs')
var path = require('path')
// var markdown = require('markdown') // dont need this yet i justneed front matter
var fm = require('front-matter')
var GitHub = require('github-api')
var getpkgjson = require('get-package-json-from-github')
// maybe use this npm thing in future https://github.com/npm/read-package-json

// unauthenticated client
const gh = new GitHub()

var srcFolder = './src/data/_starters'
var desFolder = './public/images/_starters'
var gitFolder = './src/data/_githubData'
let count = -100000 // for debugging, make this 0 so you dont get a ton of snapshots. if normal, set this to -10000 or something

// Loop through all the files in the temp directory
fs.readdir(srcFolder, function(err, files) {
  if (err) {
    console.error('Could not list the directory.', err)
    process.exit(1)
  }

  files.forEach(function(file, index) {
    // Make one pass
    var fromPath = path.join(srcFolder, file)
    fs.readFile(fromPath, 'utf8', (err, data) => {
      if (err) throw err
      const { attributes } = fm(data)
      const { demo, repo } = attributes
      // const stub = getStub(repo) // not good because the file name can diverge from the repo noame
      const stub = file.split('.')[0] // not good because the file name can diverge from the repo noame
      // *************** screenshot the demo if its available
      if (demo && count++ < 2) {
        webshot(demo, path.join(desFolder, `${stub}.png`), function(err) {
          // screenshot now saved
          if (err) console.log('err', err)
        })
      }
      // *************** get details from github repo
      if (repo && count++ < 2) {
        getpkgjson(repo)
          .then(pkgjson => {
            const repodata = gh.getRepo(getUser(repo), getStub(repo))
            repodata.getDetails((err, res) => {
              pkgjson.repoMetadata = res
              var json = JSON.stringify(pkgjson)
              fs.writeFile(
                path.join(gitFolder, `${stub}.json`),
                json,
                'utf8',
                err => {
                  if (err) throw err
                }
              )
            })
          })
          .catch(err => console.error(err) || console.log(repo))
      }
    })
  })
})

function getStub(repo) {
  return repo.split('/').slice(-1)[0]
}

function getUser(repo) {
  return repo.split('/').slice(-2)[0]
}
