import React from 'react';
import { Typography, Empty, Card } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const PerformanceTracking = () => {
  return (
    <div style={{ marginTop: 20 }}>
      {/* 화면 중앙 정렬을 위한 Card 스타일 */}
      <Card 
        bordered={false} 
        style={{ 
          height: '600px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '40px', color: '#d9d9d9', marginBottom: '10px' }}>
                <BarChartOutlined />
              </div>
              <Title level={4} style={{ margin: 0, color: '#555' }}>
                성과 트래킹 페이지 준비 중
              </Title>
              <Text type="secondary" style={{ textAlign: 'center' }}>
                인플루언서 마케팅 ROI 및 성과 지표를<br />
                분석할 수 있는 대시보드가 오픈될 예정입니다.
              </Text>
            </div>
          }
        />
      </Card>
    </div>
  );
};

export default PerformanceTracking;