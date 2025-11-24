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
| `NOFX_RSA_PRIVATE_KEY_PATH` | RSA 私钥路径，用于解密前端数据 | 指向 PEM 文件的路径 |
| `NOFX_RSA_PUBLIC_KEY_PATH` | RSA 公钥路径，提供给前端加密 | 指向 PEM 文件的路径 |
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
mkdir -p secrets
openssl genrsa -out secrets/rsa_private.pem 4096
openssl rsa -in secrets/rsa_private.pem -pubout -out secrets/rsa_public.pem

# 3. 添加到 .env 文件（路径形式）
cat >> .env << EOF
NOFX_MASTER_KEY=<主密钥>
NOFX_RSA_PRIVATE_KEY_PATH=secrets/rsa_private.pem
NOFX_RSA_PUBLIC_KEY_PATH=secrets/rsa_public.pem
JWT_SECRET=<JWT密钥>
EOF
```

## 从旧版本迁移

如果你从使用文件挂载的旧版本升级：

```bash
# 1. 迁移主密钥
export NOFX_MASTER_KEY=$(cat .secrets/master.key)

# 2. 迁移 RSA 密钥
NOFX_RSA_PRIVATE_KEY_PATH=secrets/rsa_key
NOFX_RSA_PUBLIC_KEY_PATH=secrets/rsa_key.pub

# 3. 保存到 .env 文件（使用 *_PATH）
# 4. 确认服务正常后，删除旧的密钥文件
```

## Docker 部署

### docker-compose.yml 配置

```yaml
services:
  backend:
    environment:
      - NOFX_MASTER_KEY=${NOFX_MASTER_KEY}
      - NOFX_RSA_PRIVATE_KEY_PATH=${NOFX_RSA_PRIVATE_KEY_PATH}
      - NOFX_RSA_PUBLIC_KEY_PATH=${NOFX_RSA_PUBLIC_KEY_PATH}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ${NOFX_SECRETS_DIR:-./secrets}:/app/secrets:ro
```

### 启动服务

```bash
# 确保 .env 文件存在且包含所有密钥
docker-compose up -d
```

## Kubernetes 部署

### 创建 Secret

```bash
# 使用文件創建
kubectl create secret generic nofx-crypto-keys \
  --from-literal=NOFX_MASTER_KEY="<主密钥>" \
  --from-literal=JWT_SECRET="<JWT密钥>" \
  --from-file=rsa_private.pem=secrets/rsa_private.pem \
  --from-file=rsa_public.pem=secrets/rsa_public.pem
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
        env:
        - name: NOFX_RSA_PRIVATE_KEY_PATH
          value: /app/secrets/rsa_private.pem
        - name: NOFX_RSA_PUBLIC_KEY_PATH
          value: /app/secrets/rsa_public.pem
        volumeMounts:
        - name: crypto-keys
          mountPath: /app/secrets
          readOnly: true
      volumes:
      - name: crypto-keys
        secret:
          secretName: nofx-crypto-keys
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
echo $NOFX_RSA_PRIVATE_KEY_PATH
echo $NOFX_RSA_PUBLIC_KEY_PATH

# 验证主密钥长度 (应该约 44 字符)
echo ${#NOFX_MASTER_KEY}

# 验证RSA文件存在
ls -l ${NOFX_RSA_PRIVATE_KEY_PATH:-secrets/rsa_private.pem}
ls -l ${NOFX_RSA_PUBLIC_KEY_PATH:-secrets/rsa_public.pem}

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
