import React, { useState } from 'react';
import { Radio, Typography } from 'antd';

// ✅ [경로 수정] ../components 폴더에서 불러옵니다.
import InfluencerSorting from '../components/Seeding/InfluencerSorting';
import SeedingAutomation from '../components/Seeding/SeedingAutomation';
import PerformanceTracking from '../components/Seeding/PerformanceTracking';

const InfluencerTable = () => {
  const [activeTab, setActiveTab] = useState('sorting');

  const handleTabChange = (e) => {
    setActiveTab(e.target.value);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Radio.Group 
            value={activeTab} 
            onChange={handleTabChange} 
            buttonStyle="solid" 
            size="large"
        >
          <Radio.Button value="sorting" style={{ width: '150px', textAlign: 'center' }}>인플루언서 소팅</Radio.Button>
          <Radio.Button value="automation" style={{ width: '150px', textAlign: 'center' }}>시딩 자동화</Radio.Button>
          <Radio.Button value="tracking" style={{ width: '150px', textAlign: 'center' }}>성과 트래킹</Radio.Button>
        </Radio.Group>
      </div>

      {activeTab === 'sorting' && <InfluencerSorting />}
      {activeTab === 'automation' && <SeedingAutomation />}
      {activeTab === 'tracking' && <PerformanceTracking />}
    </div>
  );
};

export default InfluencerTable;