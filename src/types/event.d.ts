export type Reward = {
  name: string;
  description: string;
  image: string;
};
export type Rewards = {
  [propName: string]: Reward;
};
export type RewardList = Reward[];
