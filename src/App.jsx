import React, { useState } from 'react';
import { Layout, Menu, theme } from 'antd';
import { UserOutlined, VideoCameraOutlined } from '@ant-design/icons';
import InfluencerTable from './InfluencerTable'; // (2)번에서 만들 파일

const { Header, Content, Footer, Sider } = Layout;

const App = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div className="demo-logo-vertical" style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          items={[
            { key: '1', icon: <UserOutlined />, label: '인플루언서 관리' },
            { key: '2', icon: <VideoCameraOutlined />, label: '영상 분석' },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }} />
        <Content style={{ margin: '24px 16px 0' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            {/* 여기에 테이블 컴포넌트가 들어갑니다 */}
            <InfluencerTable />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Influencer Admin ©{new Date().getFullYear()} Created by Athome
        </Footer>
      </Layout>
    </Layout>
  );
};

export default App;