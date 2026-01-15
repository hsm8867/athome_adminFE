import React, { useState } from 'react';
import { Table, Tag, Input, Button, message, Image, Card, Space, Row, Col, Select, InputNumber, Typography } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;
const { Option } = Select;

const InfluencerTable = () => {
  // --- 상태 관리 ---
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 필터 상태
  const [hashtagInput, setHashtagInput] = useState(""); // 입력 중인 태그
  const [hashtags, setHashtags] = useState([]);         // 등록된 태그 리스트
  const [country, setCountry] = useState("KR");         // 국가
  const [minFollowers, setMinFollowers] = useState(10000); // 최소 팔로워

  // --- 기능 함수들 ---

  // 1. 해시태그 추가
  const addHashtag = () => {
    if (hashtagInput && !hashtags.includes(hashtagInput)) {
      setHashtags([...hashtags, hashtagInput.trim()]);
      setHashtagInput("");
    }
  };

  // 2. 해시태그 삭제
  const removeHashtag = (removedTag) => {
    const newTags = hashtags.filter(tag => tag !== removedTag);
    setHashtags(newTags);
  };

  // 3. 검색 실행 (백엔드 호출)
  const onSearch = async () => {
    if (hashtags.length === 0) {
      message.warning('최소 1개 이상의 해시태그를 입력해주세요!');
      return;
    }

    setLoading(true);
    try {
      // 해시태그 배열을 "tag1,tag2" 문자열로 변환
      const hashtagsStr = hashtags.join(",");
      
      console.log("검색 요청:", { hashtags: hashtagsStr, country, min_followers: minFollowers });

      // 본인의 GCP 외부 IP로 수정해주세요!
      //const response = await axios.get(`http://localhost:9000/youtube/search`, {
      const response = await axios.get('http://34.64.158.35:8000/youtube/search',{
        params: { 
          hashtags: hashtagsStr,
          country: country,
          min_followers: minFollowers
        },
        timeout: 20000 
      });
      
      setData(response.data);

      if (response.data.length === 0) {
        message.info('조건에 맞는 인플루언서를 찾지 못했습니다.');
      } else {
        message.success(`${response.data.length}명을 찾았습니다.`);
      }
      
    } catch (error) {
      console.error('검색 에러:', error);
      message.error('데이터를 불러오는데 실패했습니다. (백엔드 로그 확인)');
    } finally {
      setLoading(false);
    }
  };

  // 테이블 컬럼
  const columns = [
    {
      title: '프로필',
      dataIndex: 'thumbnail_url',
      width: 80,
      align: 'center',
      render: (url) => <Image width={50} src={url} style={{ borderRadius: '50%' }} fallback="https://via.placeholder.com/50" />
    },
    { 
      title: '정보', 
      key: 'info',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <a href={record.profile_url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold', fontSize: '15px' }}>
            {record.display_name}
          </a>
          <span style={{ color: '#888', fontSize: '12px' }}>ID: {record.platform_user_id}</span>
        </div>
      )
    },
    { 
      title: '팔로워', 
      dataIndex: 'followers', 
      sorter: (a, b) => a.followers - b.followers,
      width: 120,
      render: (val) => <span style={{ fontWeight: 600 }}>{val?.toLocaleString()}</span>
    },
    { 
        title: '해시태그', 
        dataIndex: 'hashtags', 
        render: (tags) => (
            <Space size={[0, 4]} wrap>
                {tags && tags.slice(0, 3).map((tag, idx) => ( // 공간 절약을 위해 3개까지만 표시
                    <Tag key={idx} color="blue" style={{ fontSize: '11px' }}>#{tag}</Tag>
                ))}
            </Space>
        )
    },
    { 
      title: '상태', 
      dataIndex: 'status',
      width: 90,
      align: 'center',
      render: (status) => (
        <Tag color={status === 'SAVED' ? 'green' : 'default'}>{status}</Tag>
      )
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 20 }}>인플루언서 선별</Title>
      
      <Row gutter={24}>
        {/* --- 좌측: 필터 패널 (화면의 25% 차지) --- */}
        <Col span={6}>
          <Card title="검색 필터" bordered={false} style={{ height: '100%' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              
              {/* 1. 해시태그 입력 */}
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>해시태그</div>
                <Space.Compact style={{ width: '100%' }}>
                  <Input 
                    placeholder="예: skincare" 
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onPressEnter={addHashtag}
                  />
                  <Button type="primary" onClick={addHashtag} icon={<PlusOutlined />}>추가</Button>
                </Space.Compact>
                <div style={{ marginTop: 10 }}>
                  {hashtags.map(tag => (
                    <Tag key={tag} closable onClose={() => removeHashtag(tag)} style={{ marginBottom: 5 }}>
                      {tag}
                    </Tag>
                  ))}
                  {hashtags.length === 0 && <span style={{ color: '#bbb', fontSize: '12px' }}>추가된 태그 없음</span>}
                </div>
              </div>

              {/* 2. 국가 선택 */}
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>국가</div>
                <Select 
                  value={country} 
                  onChange={setCountry} 
                  style={{ width: '100%' }}
                >
                  <Option value="KR">🇰🇷 한국 (KR)</Option>
                  <Option value="JP">🇯🇵 일본 (JP)</Option>
                  <Option value="US">🇺🇸 미국 (US)</Option>
                  <Option value="ALL">🌏 전세계</Option>
                </Select>
              </div>

              {/* 3. 최소 팔로워 수 */}
              <div>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>최소 팔로워 수</div>
                <InputNumber 
                  style={{ width: '100%' }} 
                  value={minFollowers} 
                  onChange={setMinFollowers}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/\$\s?|(,*)/g, '')}
                  step={1000}
                />
              </div>

              {/* 4. 검색 버튼 */}
              <Button 
                type="primary" 
                block 
                size="large" 
                icon={<SearchOutlined />} 
                onClick={onSearch}
                loading={loading}
                style={{ marginTop: 20, backgroundColor: '#18181b', borderColor: '#18181b' }}
              >
                검색하기
              </Button>

            </Space>
          </Card>
        </Col>

        {/* --- 우측: 결과 테이블 (화면의 75% 차지) --- */}
        <Col span={18}>
          <Card bordered={false} bodyStyle={{ padding: 0 }}>
            <Table 
              columns={columns} 
              dataSource={data} 
              loading={loading}
              rowKey="platform_user_id"
              pagination={{ pageSize: 8 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default InfluencerTable;