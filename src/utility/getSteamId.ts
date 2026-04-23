export async function getSteam32Id(id: number) {
	const response = await fetch(`https://steamid.xyz/${id}`);
	const html = await response.text();

	const steamId = html.match(/Steam ID ([0-9]+)/);

	return steamId;
};
