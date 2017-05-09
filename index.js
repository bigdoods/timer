var Docker = require('dockerode')
var os = require('os')
var hostname = os.hostname()
var docker = new Docker({socketPath: '/var/run/docker.sock'});
var time = process.env.TIMEOUT ||  60*60*1000
setTimeout(function () {
  // create a container entity. does not query API
  var container = docker.getContainer(hostname);
  // query API for container info
  container.inspect(function (err, data) {
    if (err) {
      console.log('could not inspect container', err)
      process.exit(1)
    }
    //console.log(data.NetworkSettings.Networks);
    var netName = Object.keys(data.NetworkSettings.Networks).find(name => /_default$/.test(name))
    // tbc logging point so we know what network we will destroy
    console.log(netName)
    if (!netName) {
      console.log('no network found')
      process.exit(1)
    }
    var network = docker.getNetwork(data.NetworkSettings.Networks[netName].NetworkID)
    network.inspect(( err, data ) => {
        if (err) {
          console.log('could not inspect network', err)
          process.exit(1)
        }
        // console.log(data)
        var siblingContainers = Object.keys(data.Containers).filter( containerID => {
          return containerID.indexOf(hostname) !== 0
        })
        console.log('about to kill containers', siblingContainers)
        var promises = siblingContainers.map(containerID => {
          var container = docker.getContainer(containerID)
          return new Promise((resolve, reject) => {
            container.remove({force:true}, (err, data) => {
                if (err) {
                  return reject(err)
                }
                return resolve(data)
            })
          })
        })
        Promise.all(promises).then(
           () => console.log('Killed the fuckers') ,
           err => console.log('Did not kill all containers', err)
        )
    })
  });
},
time
);
