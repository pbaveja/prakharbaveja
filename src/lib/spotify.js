
const getAccessToken = async () => {
  const client_id = process.env.SPOTIFY_CLIENT_ID
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET
  
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64')),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: "client_credentials"
    }),
  })

  return response.json()
};

export const getPlaylists = async (playlist_ids) => {
  const { access_token } = await getAccessToken();
  let all_playlists = [];
  
  for (const playlist_id of playlist_ids) {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlist_id}`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    
    all_playlists.push(await response.json());
  }
  
  return all_playlists;  
};

export const getTopTracks = async () => {
  const { access_token } = await getAccessToken();
  const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?limit=10`, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });
    
  
  return response.json();  
};

