export type Reward = {
  name: string;
  description?: string;
  image: string;
  tokenId?: string;
  type?: string;
  event?: string;
  title?: string;
  nftAddress: string;
  accountAddress: string;
};
export type Rewards = {
  [propName: string]: Reward;
};
export type RewardList = Reward[];
