export async function getSteam32Id(id: bigint) {
	const response = await fetch(`https://steamid.xyz/${id}`);
	const html = await response.text();

	const steamId = html.match(/Steam ID ([0-9]+)/);
	if (!steamId?.[1]) {
		throw new Error("Could not parse Steam32 ID");
	}

	return steamId[1];
};
