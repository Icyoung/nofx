# NOFX AI交易系统 - 加密配置指南

本文档说明 NOFX AI 交易系统的加密配置方法。

## 加密架构

NOFX AI 交易系统使用双重加密架构保护敏感数据：

1. **RSA-4096 + AES-GCM 混合加密** - 前端到后端的安全通信
2. **AES-256-GCM 数据库加密** - 敏感数据的存储加密

### 加密流程

```
前端 → RSA-OAEP加密AES密钥 + AES-GCM加密数据 → 后端 → AES-256-GCM存储加密
```

## 环境变量配置

所有加密密钥统一通过环境变量配置，不再使用文件挂载。

### 必需的环境变量

| 环境变量 | 说明 | 格式 |
|----------|------|------|
| `NOFX_MASTER_KEY` | AES-256 主密钥，用于数据库加密 | Base64 编码的 32 字节 |
| `NOFX_RSA_PRIVATE_KEY` | RSA 私钥，用于解密前端数据 | Base64 编码的 PEM |
| `NOFX_RSA_PUBLIC_KEY` | RSA 公钥，提供给前端加密 | Base64 编码的 PEM |
| `JWT_SECRET` | JWT 认证密钥 | 任意字符串 |

## 快速开始

### 方法 1: 使用部署脚本 (推荐)

```bash
# 运行一键部署脚本
./deploy_encryption.sh

# 脚本会自动：
# 1. 生成所有必要的密钥
# 2. 写入 .env 文件
# 3. 设置正确的文件权限
```

### 方法 2: 手动配置

```bash
# 1. 生成主密钥 (AES-256)
openssl rand -base64 32

# 2. 生成 RSA 密钥对
openssl genrsa -out rsa_key 4096
openssl rsa -in rsa_key -pubout -out rsa_key.pub

# 3. 转换为 base64 格式
# Linux:
export NOFX_RSA_PRIVATE_KEY=$(base64 -w0 rsa_key)
export NOFX_RSA_PUBLIC_KEY=$(base64 -w0 rsa_key.pub)

# macOS:
export NOFX_RSA_PRIVATE_KEY=$(base64 rsa_key)
export NOFX_RSA_PUBLIC_KEY=$(base64 rsa_key.pub)

# 4. 添加到 .env 文件
cat >> .env << EOF
NOFX_MASTER_KEY=<主密钥>
NOFX_RSA_PRIVATE_KEY=<RSA私钥>
NOFX_RSA_PUBLIC_KEY=<RSA公钥>
JWT_SECRET=<JWT密钥>
EOF

# 5. 删除临时密钥文件
rm rsa_key rsa_key.pub
```

## 从旧版本迁移

如果你从使用文件挂载的旧版本升级：

```bash
# 1. 迁移主密钥
export NOFX_MASTER_KEY=$(cat .secrets/master.key)

# 2. 迁移 RSA 密钥
# Linux:
export NOFX_RSA_PRIVATE_KEY=$(base64 -w0 secrets/rsa_key)
export NOFX_RSA_PUBLIC_KEY=$(base64 -w0 secrets/rsa_key.pub)

# macOS:
export NOFX_RSA_PRIVATE_KEY=$(base64 secrets/rsa_key)
export NOFX_RSA_PUBLIC_KEY=$(base64 secrets/rsa_key.pub)

# 3. 保存到 .env 文件
# 4. 确认服务正常后，删除旧的密钥文件
```

## Docker 部署

### docker-compose.yml 配置

```yaml
services:
  backend:
    environment:
      - NOFX_MASTER_KEY=${NOFX_MASTER_KEY}
      - NOFX_RSA_PRIVATE_KEY=${NOFX_RSA_PRIVATE_KEY}
      - NOFX_RSA_PUBLIC_KEY=${NOFX_RSA_PUBLIC_KEY}
      - JWT_SECRET=${JWT_SECRET}
```

### 启动服务

```bash
# 确保 .env 文件存在且包含所有密钥
docker-compose up -d
```

## Kubernetes 部署

### 创建 Secret

```bash
# 从 .env 文件创建
kubectl create secret generic nofx-crypto-keys --from-env-file=.env

# 或直接指定
kubectl create secret generic nofx-crypto-keys \
  --from-literal=NOFX_MASTER_KEY="<主密钥>" \
  --from-literal=NOFX_RSA_PRIVATE_KEY="<RSA私钥>" \
  --from-literal=NOFX_RSA_PUBLIC_KEY="<RSA公钥>" \
  --from-literal=JWT_SECRET="<JWT密钥>"
```

### Deployment 配置

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nofx-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        envFrom:
        - secretRef:
            name: nofx-crypto-keys
```

## 安全要求

### 文件权限

| 文件 | 权限 | 说明 |
|------|------|------|
| `.env` | 600 | 仅所有者可读写 |

### 最佳实践

1. **不要提交到 Git** - 确保 `.env` 在 `.gitignore` 中
2. **定期备份** - 密钥丢失将导致数据无法恢复
3. **使用密钥管理系统** - 生产环境建议使用 HashiCorp Vault 等
4. **限制访问** - 只有必要的人员才能访问密钥

## 故障排除

### 常见错误

1. **"NOFX_MASTER_KEY 环境变量未设置"**
   - 确保 `.env` 文件存在并包含 `NOFX_MASTER_KEY`
   - 运行 `source .env` 加载环境变量

2. **"cipher: message authentication failed"**
   - 主密钥与加密数据不匹配
   - 检查是否使用了正确的密钥

3. **"invalid hex character 'k' in private key"**
   - 私钥解密失败
   - 检查 RSA 密钥配置是否正确

### 验证配置

```bash
# 检查环境变量是否设置
echo $NOFX_MASTER_KEY | head -c 20
echo $NOFX_RSA_PRIVATE_KEY | head -c 30
echo $NOFX_RSA_PUBLIC_KEY | head -c 30

# 验证主密钥长度 (应该约 44 字符)
echo ${#NOFX_MASTER_KEY}

# 启动服务查看日志
docker-compose logs backend | grep "加密"
```

## 算法规格

### RSA-4096
- **用途**: 前端到后端的密钥交换
- **密钥长度**: 4096 bits
- **填充**: OAEP with SHA-256
- **安全级别**: 相当于 128 位对称加密

### AES-256-GCM
- **用途**: 数据库敏感字段加密
- **密钥长度**: 256 bits
- **模式**: GCM (Galois/Counter Mode)
- **认证**: 内置消息认证
- **安全级别**: 256 位安全强度

---

## 技术支持

如有问题，请检查：
1. 所有环境变量是否正确设置
2. `.env` 文件权限是否为 600
3. 服务启动日志中的加密初始化信息
