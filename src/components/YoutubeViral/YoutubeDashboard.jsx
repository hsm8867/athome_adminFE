import React, { useState, useEffect } from 'react';
import { Input, Button, Table, Card, message, Space, Typography, Modal, Select, Form, Spin } from 'antd';
import { YoutubeOutlined, RobotOutlined, ReloadOutlined, CopyOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const YoutubeDashboard = () => {
  // --- 상태 관리 ---
  const [urlInput, setUrlInput] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const [currentVideoId, setCurrentVideoId] = useState(null);
  // ✅ 영상 정보 저장용 state 추가
  const [videoInfo, setVideoInfo] = useState({ title: '-', url: '-' });

  const [comments, setComments] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [personas, setPersonas] = useState([]); 
  const [form] = Form.useForm();

  const API_BASE_URL = 'http://34.64.158.35:8000';

  useEffect(() => {
    fetchPersonas();
  }, []);

  // currentVideoId가 변경되면 해당 영상의 상세 정보(제목, URL)를 찾아서 설정
  useEffect(() => {
    if (currentVideoId) {
      fetchVideoInfo(currentVideoId);
    }
  }, [currentVideoId]);

  const fetchPersonas = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/youtube/persona`);
      setPersonas(response.data);
    } catch (error) {
      console.error('페르소나 목록 로딩 실패:', error);
    }
  };

  // ✅ 영상 상세 정보 조회 (기존 목록 API 활용)
  const fetchVideoInfo = async (videoId) => {
    try {
      // 백엔드에 단건 조회 API가 없다면 목록에서 찾음
      const response = await axios.get(`${API_BASE_URL}/youtube/videos`);
      const targetVideo = response.data.find(v => v.id === videoId); // id는 숫자형 주의
      
      if (targetVideo) {
        setVideoInfo({
          title: targetVideo.title || '-',
          url: targetVideo.url || '-'
        });
      }
    } catch (error) {
      console.error("영상 정보 조회 실패:", error);
    }
  };

  const handleOpenModal = () => {
    if (!urlInput) {
      message.warning('YouTube URL을 입력해주세요.');
      return;
    }
    form.resetFields();
    form.setFieldsValue({ title: '' }); 
    setIsModalVisible(true);
  };

  const handleGenerateConfirm = async () => {
    try {
      const values = await form.validateFields();
      setIsModalVisible(false); 
      setIsGenerating(true);    

      const response = await axios.post(`${API_BASE_URL}/youtube/videos`, {
        url: urlInput,
        title: values.title,        
        persona_id: values.persona  
      });

      const videoId = response.data.video_id;
      setCurrentVideoId(videoId);
      
      // 입력한 정보로 즉시 업데이트 (API 조회 전이라도 보이게)
      setVideoInfo({ title: values.title, url: urlInput });
      
      message.success('요청 성공! 댓글을 생성하고 있습니다.');
      setTimeout(() => fetchComments(videoId), 2000);

    } catch (error) {
      if (error.errorFields) return;
      console.error(error);
      message.error('영상 등록 및 생성 요청 실패');
      setIsGenerating(false);
    }
  };

  const fetchComments = async (videoId = currentVideoId) => {
    if (!videoId) return;

    setListLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/youtube/videos/${videoId}/comments`);
      
      const formattedData = response.data.map((item, index) => {
        const baseItem = (typeof item === 'string') 
          ? { id: index, content: item, is_used: false } 
          : item;

        return {
          key: baseItem.id || index, 
          ...baseItem,
          status: baseItem.status || '대기 중', 
          scheduled_time: baseItem.scheduled_time || null, 
        };
      });
      
      setComments(formattedData);
      setSelectedRowKeys([]); 
      setIsGenerating(false);

      if (response.data.length > 0) {
        message.success('댓글 목록이 업데이트되었습니다.');
      } else {
        message.info('아직 생성된 댓글이 없습니다. 잠시 후 [목록 새로고침]을 눌러주세요.');
      }
    } catch (error) {
      console.error(error);
      message.error('댓글 목록 로딩 실패');
      setIsGenerating(false);
    } finally {
      setListLoading(false);
    }
  };

  const handleContentChange = (key, newContent) => {
    setComments(prev => prev.map(item => 
      item.key === key ? { ...item, content: newContent } : item
    ));
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const handleRegisterComments = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('등록할 댓글을 하나 이상 선택해주세요.');
      return;
    }

    setUploadLoading(true);

    try {
      const now = dayjs();
      let updatedComments = [...comments];
      const selectedItems = comments.filter(item => selectedRowKeys.includes(item.key));
      const totalSelected = selectedItems.length;
      const getRandomMinute = (max) => Math.floor(Math.random() * max);

      selectedItems.forEach((item, index) => {
        let scheduleTime;
        if (totalSelected <= 3) {
          scheduleTime = now.add(getRandomMinute(30), 'minute');
        } else {
          if (index < 3) {
            scheduleTime = now.add(getRandomMinute(30), 'minute');
          } else {
            const delay = 30 + (index - 3) * 30;
            scheduleTime = now.add(delay, 'minute');
          }
        }

        const targetIndex = updatedComments.findIndex(c => c.key === item.key);
        if (targetIndex > -1) {
            updatedComments[targetIndex] = {
                ...updatedComments[targetIndex],
                status: '등록 완료', 
                scheduled_time: scheduleTime.format('YYYY/MM/DD/HH/mm/ss')
            };
        }
      });

      setComments(updatedComments);

      const payload = selectedItems.map(item => {
          const updatedItem = updatedComments.find(c => c.key === item.key);
          return {
              comment_id: item.id,
              content: updatedItem.content,
              scheduled_time: updatedItem.scheduled_time
          };
      });

      await axios.post(`${API_BASE_URL}/youtube/${currentVideoId}/upload_comment`, {
          comments: payload
      });

      message.success(`${selectedRowKeys.length}개의 댓글이 등록되었습니다.`);
      setSelectedRowKeys([]);

    } catch (error) {
      console.error(error);
      message.error('댓글 등록 중 오류가 발생했습니다.');
    } finally {
      setUploadLoading(false);
    }
  };

  // ✅ 테이블 컬럼 업데이트 (영상 제목, URL 추가)
  const columns = [
    {
      title: '영상제목',
      dataIndex: 'video_title', // 실제 데이터에는 없지만 render로 처리
      key: 'video_title',
      width: '15%',
      render: () => <Text strong>{videoInfo.title}</Text>
    },
    {
      title: 'URL',
      dataIndex: 'video_url',
      key: 'video_url',
      width: '15%',
      render: () => (
        <a href={videoInfo.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px' }}>
          {videoInfo.url.length > 20 ? videoInfo.url.substring(0, 20) + '...' : videoInfo.url}
        </a>
      )
    },
    {
      title: '생성된 댓글 (수정 가능)',
      dataIndex: 'content',
      key: 'content',
      width: '30%',
      render: (text, record) => (
        <TextArea 
            value={text} 
            onChange={(e) => handleContentChange(record.key, e.target.value)}
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ border: 'none', background: 'transparent', padding: 0, color: '#d63384' }}
        />
      )
    },
    {
        title: '등록상태',
        dataIndex: 'status',
        key: 'status',
        width: '10%',
        align: 'center',
        render: (status) => (
            <span style={{ color: status === '등록 완료' ? '#d63384' : '#888' }}>
                {status}
            </span>
        )
    },
    {
        title: '반영 시점',
        dataIndex: 'scheduled_time',
        key: 'scheduled_time',
        width: '20%',
        align: 'center',
        render: (time) => (
            <span style={{ color: time ? '#1890ff' : '#ccc' }}>
                {time || '-'}
            </span>
        )
    },
    {
      title: '작업',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Button size="small" icon={<CopyOutlined />} onClick={() => {
            navigator.clipboard.writeText(record.content);
            message.success('복사됨');
        }}>
          복사
        </Button>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  return (
    <div style={{ marginTop: 20 }}>
      <Spin spinning={isGenerating} tip="AI가 댓글을 생성중입니다..." size="large">
        
        {/* 상단 URL 입력 */}
        <Card bordered={false} style={{ marginBottom: 24 }}>
          <Title level={4} style={{ marginBottom: 16 }}>
            <YoutubeOutlined style={{ color: 'red', marginRight: 8 }} />
            영상 등록 및 댓글 생성
          </Title>
          <Space.Compact style={{ width: '100%' }} size="large">
            <Input 
              placeholder="YouTube 영상 URL을 입력하세요" 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onPressEnter={handleOpenModal}
            />
            <Button 
              type="primary" 
              icon={<RobotOutlined />} 
              onClick={handleOpenModal}
              style={{ backgroundColor: '#ff0000', borderColor: '#ff0000' }}
            >
              등록 & 생성
            </Button>
          </Space.Compact>
        </Card>

        {/* 하단 댓글 리스트 */}
        <Card bordered={false}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0 }}>
               댓글 리스트 {currentVideoId && <Text type="secondary">(Video ID: {currentVideoId})</Text>}
            </Title>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => fetchComments(currentVideoId)} 
              loading={listLoading}
              disabled={!currentVideoId}
            >
              목록 새로고침
            </Button>
          </div>

          <Table 
            rowSelection={rowSelection}
            columns={columns} 
            dataSource={comments} 
            pagination={{ pageSize: 10 }} 
            loading={listLoading}
            locale={{ emptyText: currentVideoId ? '생성된 댓글이 없습니다. 새로고침을 눌러주세요.' : '영상을 먼저 등록해주세요.' }}
          />
          
          <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button 
                type="primary" 
                size="large"
                icon={<UploadOutlined />}
                onClick={handleRegisterComments}
                loading={uploadLoading}
                style={{ backgroundColor: '#1f1f1f', borderColor: '#1f1f1f', minWidth: '150px' }}
              >
                  댓글 등록
              </Button>
          </div>

        </Card>
      </Spin>

      <Modal
        title="영상 정보 및 페르소나 설정"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleGenerateConfirm}
        okText="댓글 생성 시작"
        cancelText="취소"
        confirmLoading={isGenerating}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="영상 제목"
            name="title"
            rules={[{ required: true, message: '제목 입력' }]}
          >
            <Input prefix={<EditOutlined />} />
          </Form.Item>

          <Form.Item
            label="AI 페르소나"
            name="persona"
            rules={[{ required: true, message: '페르소나 선택' }]}
          >
            <Select>
              {personas.map(p => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default YoutubeDashboard;