from dataclasses import dataclass

import gymnasium as gym
import numpy as np
from gymnasium import spaces


@dataclass
class Fighter: 
    x: float
    y: float
    velocity_x: float = 0
    velocity_y: float = 0
    health: int = 100
    facing: int = 1
    on_ground: bool = True
    attack_ticks_remaining: int = 0
    

class WrestleEnv(gym.Env):
    def __init__(self) -> None:
        super().__init__()

        self.action_space = spaces.MultiDiscrete([3, 2, 2])

        self.observation_space = spaces.Box(
            low = -1,
            high = 1,
            shape = (12,),
            dtype = np.float32,
        )

        self.player_one: Fighter
        self.player_two: Fighter

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)

        self.player_one, self.player_two = reset()
        return self.get_observation(), {}

    def step(self, action):
            # Convert the model's array into your Action class.
            player_one_action = Action(
                move=int(action[0]) - 1,
                jump=bool(action[1]),
                punch=bool(action[2]),
            )
    
            # Begin with a very simple opponent.
            player_two_action = self.get_opponent_action()
    
            match_finished = step(
                self.player_one,
                self.player_two,
                player_one_action,
                player_two_action,
            )
    
            reward = self.calculate_reward()
            terminated = match_finished
            truncated = False
    
            return self.get_observation(), reward, terminated, truncated, {}