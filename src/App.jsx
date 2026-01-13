import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import { UserOutlined, VideoCameraOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import InfluencerTable from './InfluencerTable';

// Layout 컴포넌트에서 필요한 하위 컴포넌트 추출
const { Header, Content, Footer, Sider } = Layout;

const App = () => {
  // 사이드바 접기/펴기 상태 관리
  const [collapsed, setCollapsed] = useState(false);
  
  // Ant Design 테마 토큰 사용 (배경색, 둥근 모서리 등)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // 메뉴 아이템 정의
  const menuItems = [
    { key: '1', icon: <UserOutlined />, label: '인플루언서 관리' },
    { key: '2', icon: <VideoCameraOutlined />, label: '영상 분석' },
  ];

  return (
    // 전체 레이아웃 (최소 높이를 화면 전체로 설정)
    <Layout style={{ minHeight: '100vh' }}>
      {/* 좌측 사이드바 */}
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="demo-logo-vertical" style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6 }} />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          items={menuItems}
        />
      </Sider>
      
      {/* 우측 메인 영역 */}
      <Layout>
        {/* 상단 헤더 */}
        <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', alignItems: 'center' }}>
            {/* 사이드바 토글 버튼 */}
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                className: 'trigger',
                onClick: () => setCollapsed(!collapsed),
                style: { fontSize: '18px', padding: '0 24px', cursor: 'pointer', transition: 'color 0.3s' }
            })}
        </Header>
        
        {/* 메인 콘텐츠 영역 */}
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: colorBgContainer, borderRadius: borderRadiusLG }}>
          {/* 여기에 우리가 만든 테이블 컴포넌트가 들어갑니다 */}
          <InfluencerTable />
        </Content>
        
        {/* 하단 푸터 */}
        <Footer style={{ textAlign: 'center' }}>
          Influencer Admin ©{new Date().getFullYear()} Created by Athome
        </Footer>
      </Layout>
    </Layout>
  );
};

export default App;