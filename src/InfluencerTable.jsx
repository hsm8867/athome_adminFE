import React, { useState } from 'react';
import { Radio, Typography } from 'antd';

//  분리한 파일들 import
import InfluencerSorting from './InfluencerSorting';
import SeedingAutomation from './SeedingAutomation';

const { Title } = Typography;

const InfluencerTable = () => {
  const [activeTab, setActiveTab] = useState('sorting');

  const handleTabChange = (e) => {
    setActiveTab(e.target.value);
  };

  return (
    <div>
      {/* 탭 버튼 */}
      <div style={{ marginBottom: 20 }}>
        <Radio.Group value={activeTab} onChange={handleTabChange} buttonStyle="solid" size="large">
          <Radio.Button value="sorting" style={{ width: '150px', textAlign: 'center' }}>인플루언서 소팅</Radio.Button>
          <Radio.Button value="automation" style={{ width: '150px', textAlign: 'center' }}>시딩 자동화</Radio.Button>
          <Radio.Button value="tracking" style={{ width: '150px', textAlign: 'center' }}>성과 트래킹</Radio.Button>
        </Radio.Group>
      </div>

      {/* 조건부 렌더링 */}
      {activeTab === 'sorting' && <InfluencerSorting />}
      
      {activeTab === 'automation' && <SeedingAutomation />}
      
      {activeTab === 'tracking' && (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Title level={4} style={{ color: '#ccc' }}>성과 트래킹 페이지 준비 중</Title>
        </div>
      )}
    </div>
  );
};

export default InfluencerTable;