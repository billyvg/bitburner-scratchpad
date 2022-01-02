/** @param {NS} ns **/
/*
create list of all servers
iterate through list:
count programs
open ports
nuke
scp and exec hack script
if all 5 ports are open then everything above has run, remove from list
*/
export async function main(ns) {
	//create array of all servers except purchased called listServers[]
	var listServers = await ns.scan('home');
	let listIndex = 0;

	while (listIndex < listServers.length) {
		await ns.sleep(50);
		let listScan = ns.scan(listServers[listIndex], true);
		for (let i = 0; i < listScan.length; i++) {
			if (listServers.indexOf(listScan[i]) === -1) {
				listServers[listServers.length] = listScan[i];
			}
		}
		//at this point the full list includes purchased servers
		listIndex++;
	}
	//make array of purchased servers
	var persServers = await ns.getPurchasedServers();
	//if I have purchased servers, remove them from listServers
	if (persServers.length > 0) {
		for (let i = 0; i < persServers.length; i++) {
			if (listServers.indexOf(persServers[i]) != -1) {
				let spliceIndex = listServers.indexOf(persServers[i]);
				listServers.splice(spliceIndex, 1);
			}
		}
	}

	let programCount = 0;

	if (await ns.fileExists('BruteSSH.exe', 'home')) {
		programCount++;
	}
	if (await ns.fileExists('FTPCrack.exe', 'home')) {
		programCount++;
	}
	if (await ns.fileExists('relaySMTP.exe', 'home')) {
		programCount++;
	}
	if (await ns.fileExists('HTTPWorm.exe', 'home')) {
		programCount++;
	}
	if (await ns.fileExists('SQLInject.exe', 'home')) {
		programCount++;
	}

	//runs until we're out of servers on list, defines programCount once per loop of server list
	while (listServers.length > 0) {
		let spliceServers = [];

		//iterate through list once, when done we check list length and redefine programCount to go again
		for (let i = 0; i < listServers.length; i++) {
			//variables with scope of entire for loop
			let serverMaxRam = await ns.getServerMaxRam(listServers[i]);
			let serverMaxMoney = await ns.getServerMaxMoney(listServers[i])
			let scriptRam = await ns.getScriptRam('h-early.js', 'home');
			let reqPorts = await ns.getServerNumPortsRequired(listServers[i]);
			let threads = Math.floor(serverMaxRam / scriptRam);
			let serverLevel = await ns.getServerRequiredHackingLevel(listServers[i]);
			//open ports
			switch (programCount) {
				case 5:
					await ns.sqlinject(listServers[i]);
				case 4:
					await ns.httpworm(listServers[i]);
				case 3:
					await ns.relaysmtp(listServers[i]);
				case 2:
					await ns.ftpcrack(listServers[i]);
				case 1:
					await ns.brutessh(listServers[i]);
				case 0:
					await ns.sleep(100);
					break;
			}
			//nukes and opens ports of servers where we can't execute hack scripts, skips to end to remove if 5 programs
			//doesn't go through scp and exec if 0money or 0ram, only does anything if we don't already have root
			if (serverMaxMoney < 1 ||
				serverMaxRam < scriptRam && await ns.hasRootAccess(listServers[i]) == false && programCount >= reqPorts) {
				await ns.nuke(listServers[i]);
				await ns.sleep(100);
				/*start of stuff to do on servers that can hold scripts
				check to see if it's nukable
				scp h-early to server
				nuke, exec h-early with server name for args
				*/
			} else if (
				await ns.getHackingLevel() >= serverLevel &&
				await ns.hasRootAccess(listServers[i]) == false &&
				programCount >= reqPorts
			) {
				if (await ns.fileExists('h-early.js', listServers[i]) == false) {
					await ns.scp('h-early.js', 'home', listServers[i]);
				}
				await ns.nuke(listServers[i]);
				await ns.exec('h-early.js', listServers[i], threads, listServers[i]);
				await ns.sleep(100);
			}

			//remove if program count is 5
			if (programCount == 5 &&
			await ns.getHackingLevel() >= serverLevel &&
			await ns.hasRootAccess(listServers[i]) == true) {
				if (serverMaxMoney == 0 || serverMaxRam < scriptRam) {
					await ns.tprint(listServers[i] + " is open");
					spliceServers.push(listServers[i]);
					await ns.sleep(100);
				} else {
					await ns.tprint(listServers[i] + " is open and hacking itself");
					spliceServers.push(listServers[i]);
					await ns.sleep(100);
				}

			}
		}	//end of for
		
		//remove servers that were added to the splice list
		if (spliceServers.length > 0) {
			for (let i = 0; i < spliceServers.length; i++) {
				await ns.sleep(150);
				await ns.print("removing " + spliceServers[i] + " from listServers");
				listServers.splice(listServers.indexOf(spliceServers[i]), 1);
			}
		}
	}	//end of while
}	//end of main
