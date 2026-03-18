export const DEMO_STORAGE_KEYS={
  players:"sl:players",
  playerProfiles:"sl:player-profiles",
  teams:"sl:teams",
  drills:"sl:drills",
  programDrills:"sl:program-drills",
  scores:"sl:scores",
};

const persistDemoSlices=async({persist,slices})=>{
  await Promise.all(slices.map(({key,value,setter})=>persist(key,value,setter)));
};

export async function applySharedDemoData({persist,slices}){
  await persistDemoSlices({persist,slices});
}

export async function resetSharedDemoData({persist,slices}){
  await persistDemoSlices({persist,slices});
}
