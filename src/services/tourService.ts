import AsyncStorage from '@react-native-async-storage/async-storage';

const ELIGIBLE_KEY = '@penny_tour_eligible_v1';
const COMPLETE_KEY = '@penny_tour_complete_v1';

export const markTourEligible = async (): Promise<void> => {
  await AsyncStorage.setItem(ELIGIBLE_KEY, 'true');
};

export const shouldShowTour = async (): Promise<boolean> => {
  const [eligible, complete] = await AsyncStorage.multiGet([ELIGIBLE_KEY, COMPLETE_KEY]);
  return eligible[1] === 'true' && complete[1] !== 'true';
};

export const completeTour = async (): Promise<void> => {
  await AsyncStorage.multiSet([[COMPLETE_KEY, 'true'], [ELIGIBLE_KEY, 'false']]);
};
