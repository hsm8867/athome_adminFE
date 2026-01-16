import React from 'react';
import { Typography, Card, Input, Button, Form, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const YoutubePrompt = () => {
  const [form] = Form.useForm();

  const handleSave = (values) => {
    console.log('저장된 프롬프트:', values);
    message.success('프롬프트 설정이 저장되었습니다.');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Title level={4}>댓글 생성 AI 프롬프트 설정</Title>
      <Paragraph type="secondary">
        AI가 유튜브 댓글을 생성할 때 사용할 규칙(페르소나, 톤앤매너)을 설정합니다.
      </Paragraph>

      <Card bordered={false}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            system_prompt: "너는 유튜브 영상의 분위기를 분석하여 시청자가 쓴 것처럼 가장 자연스러운 한국어 댓글을 생성하는 AI야. 홍보성 글은 피하고, 찐팬이 쓴 것 같은 말투를 써. 반드시 이모지를 포함해서 5개의 댓글을 작성해."
          }}
        >
          <Form.Item
            label="시스템 프롬프트 (AI 페르소나 설정)"
            name="system_prompt"
            rules={[{ required: true, message: '시스템 프롬프트를 입력해주세요.' }]}
          >
            <TextArea 
              rows={6} 
              placeholder="예: 너는 20대 대학생 같은 말투를 쓰는 AI야..." 
              style={{ resize: 'none' }}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              설정 저장
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default YoutubePrompt;