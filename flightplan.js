const plan = require('flightplan');

const appName = "test-deploy";
const username = "andrew";
const startFile = "bin/www";

const tmpDir = appName + '-' + new Date().getTime();

plan.target('production', [
	{
		host: '167.99.171.62',
		username: username,
		agent: process.env.SSH_AUTH_SOCK
	}
]);

plan.local(local => {
	local.log('Copy files to remote hosts');
	const filesToCopy = local.exec('git ls-files', {silent: true});
	local.transfer(filesToCopy, '/tmp/' + tmpDir);
});

plan.remote(remote => {
	remote.log('Move folder to root');
	remote.sudo('cp -R /tmp/' + tmpDir + ' ~', {user: username});
	remote.rm('-rf /tmp/' + tmpDir);
	remote.log('Install dependencies');
	remote.sudo('npm --production --prefix ~/' + tmpDir + ' install ~/' + tmpDir, {user: username});
	remote.log('Reload application');
	remote.sudo('ln -snf ~/' + tmpDir + ' ~/' + appName, {user: username});
	remote.exec('cd ~/' + appName + '&&' + 'forever start ./bin/www', {failsafe: true});
	remote.exec('cd ~/' + appName + '&&' + 'forever stop ./bin/www');
});
