import React, { useState } from 'react';
import { Table, Tag, Input, Button, message, Image, Card, Space, Row, Col, Select, InputNumber } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const { Option } = Select;


const InfluencerSorting = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState([]);
  const [country, setCountry] = useState("KR");
  const [minFollowers, setMinFollowers] = useState(10000);

  const addHashtag = () => {
    if (hashtagInput && !hashtags.includes(hashtagInput)) {
      setHashtags([...hashtags, hashtagInput.trim()]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (removedTag) => {
    const newTags = hashtags.filter(tag => tag !== removedTag);
    setHashtags(newTags);
  };

  const onSearch = async () => {
    if (hashtags.length === 0) {
      message.warning('최소 1개 이상의 해시태그를 입력해주세요!');
      return;
    }
    setLoading(true);
    try {
      const hashtagsStr = hashtags.join(",");
      const response = await axios.get(`${API_BASE_URL}/youtube/search`,{
        params: { hashtags: hashtagsStr, country, min_followers: minFollowers },
        timeout: 20000 
      });
      setData(response.data);
      if (response.data.length === 0) message.info('검색 결과가 없습니다.');
      else message.success(`${response.data.length}명을 찾았습니다.`);
    } catch (error) {
      console.error(error);
      message.error('데이터 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '프로필', dataIndex: 'thumbnail_url', width: 80, align: 'center',
      render: (url) => <Image width={50} src={url} style={{ borderRadius: '50%' }} fallback="https://via.placeholder.com/50" />
    },
    { 
      title: '정보', key: 'info',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <a href={record.profile_url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold' }}>{record.display_name}</a>
          <span style={{ color: '#888', fontSize: '12px' }}>ID: {record.platform_user_id}</span>
        </div>
      )
    },
    { title: '팔로워', dataIndex: 'followers', sorter: (a, b) => a.followers - b.followers, width: 120, render: val => val?.toLocaleString() },
    { 
        title: '해시태그', dataIndex: 'hashtags', 
        render: (tags) => <Space wrap>{tags?.slice(0, 3).map((t, i) => <Tag key={i} color="blue">#{t}</Tag>)}</Space>
    },
    { title: '상태', dataIndex: 'status', width: 90, align: 'center', render: s => <Tag color={s === 'SAVED' ? 'green' : 'default'}>{s}</Tag> },
  ];

  return (
    <Row gutter={24}>
      <Col span={6}>
        <Card title="검색 필터" bordered={false} style={{ height: '100%' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>해시태그</div>
              <Space.Compact style={{ width: '100%' }}>
                <Input placeholder="예: skincare" value={hashtagInput} onChange={e => setHashtagInput(e.target.value)} onPressEnter={addHashtag} />
                <Button type="primary" onClick={addHashtag} icon={<PlusOutlined />}>추가</Button>
              </Space.Compact>
              <div style={{ marginTop: 10 }}>{hashtags.map(tag => <Tag key={tag} closable onClose={() => removeHashtag(tag)}>{tag}</Tag>)}</div>
            </div>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>국가</div>
              <Select value={country} onChange={setCountry} style={{ width: '100%' }}>
                <Option value="KR">🇰🇷 한국</Option> <Option value="JP">🇯🇵 일본</Option> <Option value="US">🇺🇸 미국</Option> <Option value="ALL">🌏 전세계</Option>
              </Select>
            </div>
            <div>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>최소 팔로워</div>
              <InputNumber style={{ width: '100%' }} value={minFollowers} onChange={setMinFollowers} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} step={1000} />
            </div>
            <Button type="primary" block size="large" icon={<SearchOutlined />} onClick={onSearch} loading={loading} style={{ marginTop: 20, backgroundColor: '#18181b', borderColor: '#18181b' }}>검색하기</Button>
          </Space>
        </Card>
      </Col>
      <Col span={18}>
        <Card bordered={false} bodyStyle={{ padding: 0 }}>
          <Table columns={columns} dataSource={data} loading={loading} rowKey="platform_user_id" pagination={{ pageSize: 8 }} />
        </Card>
      </Col>
    </Row>
  );
};

export default InfluencerSorting;