// deploy_to_server.js - Deploy updated files to the cloud server using SSH/SFTP
const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');

const host = '8.136.126.235';
const port = 22;
const username = 'Administrator';
const password = '123789!@#songSONG';

const localZipPath = 'D:\\sx1\\oa_project.zip';
const remoteZipPath = 'C:\\oa_project.zip';

const conn = new Client();

console.log(`Connecting to cloud server ${host} via SSH...`);

conn.on('ready', () => {
  console.log('SSH connection successful!');

  // Step 1: Stop services before copy to release file locks
  console.log('Stopping remote Nginx and PM2 servers...');
  const stopCommand = 'powershell -Command "Stop-Process -Name nginx -Force -ErrorAction SilentlyContinue; pm2 stop oa_server; pm2 delete oa_server; Write-Host \'Services stopped successfully!\'"';
  
  conn.exec(stopCommand, (err, stream) => {
    if (err) {
      console.error('Error executing stop command:', err);
      conn.end();
      return;
    }
    
    stream.on('close', (code) => {
      console.log(`Stop command closed with exit code ${code}`);
      
      // Step 2: Upload the zip archive via SFTP
      uploadZip();
    }).on('data', (data) => {
      process.stdout.write('[Remote Stop Output]: ' + data);
    }).stderr.on('data', (data) => {
      process.stderr.write('[Remote Stop Error]: ' + data);
    });
  });
}).on('error', (err) => {
  console.error('SSH connection failed:', err);
}).connect({ host, port, username, password });

function uploadZip() {
  console.log('Opening SFTP session...');
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('SFTP error:', err);
      conn.end();
      return;
    }

    console.log(`Uploading local file ${localZipPath} to remote ${remoteZipPath}...`);
    const readStream = fs.createReadStream(localZipPath);
    const writeStream = sftp.createWriteStream(remoteZipPath);

    writeStream.on('close', () => {
      console.log('[√] Zip archive uploaded successfully!');
      
      // Step 3: Unzip and deploy on the remote server
      unzipAndDeploy();
    });

    writeStream.on('error', (uploadErr) => {
      console.error('Upload failed:', uploadErr);
      conn.end();
    });

    readStream.pipe(writeStream);
  });
}

function unzipAndDeploy() {
  console.log('Extracting archive and running deploy script...');
  const deployCommand = 'powershell -Command "' +
    'if (Test-Path C:\\oa_project_temp) { Remove-Item -Path C:\\oa_project_temp -Recurse -Force }; ' +
    'Expand-Archive -Path C:\\oa_project.zip -DestinationPath C:\\oa_project_temp -Force; ' +
    'Copy-Item -Path C:\\oa_project_temp\\* -Destination C:\\oa_project -Recurse -Force; ' +
    'Remove-Item -Path C:\\oa_project_temp -Recurse -Force; ' +
    'Remove-Item -Path C:\\oa_project.zip -Force; ' +
    'cd C:\\oa_project; ' +
    '.\\deploy_setup.ps1' +
    '"';

  conn.exec(deployCommand, (err, stream) => {
    if (err) {
      console.error('Error executing deploy command:', err);
      conn.end();
      return;
    }

    stream.on('close', (code) => {
      console.log(`Deployment script finished with exit code ${code}`);
      conn.end();
      if (code === 0) {
        console.log('\n=============================================');
        console.log('   DEPLOYS SUCCESSFUL! SYSTEM RUNNING ON:');
        console.log('        http://8.136.126.235');
        console.log('=============================================');
      } else {
        console.error('Deployment failed.');
      }
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}
