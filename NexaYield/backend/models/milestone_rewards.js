module.exports = (sequelize, DataTypes) => {
  const MilestoneReward = sequelize.define('MILESTONE_REWARDS', {
    user_id: { type: DataTypes.INTEGER },
    milestone_amount: { type: DataTypes.DECIMAL(18, 2) },
    reward_amount: { type: DataTypes.DECIMAL(18, 2) },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    timestamps: false,
    tableName: 'milestone_rewards'
  });

  return MilestoneReward;
};
