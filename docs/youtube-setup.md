# YouTube Data API v3 - Setup Guide

## 1. Criar Projeto no Google Cloud

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em **Select a project** > **New Project**
3. Dê um nome (ex: "IA Marketing Digital") e clique em **Create**

## 2. Habilitar YouTube Data API v3

1. No menu lateral, vá em **APIs & Services > Library**
2. Pesquise por **YouTube Data API v3**
3. Clique nela e depois em **Enable**

## 3. Criar API Key

1. Vá em **APIs & Services > Credentials**
2. Clique em **Create Credentials > API Key**
3. Copie a chave gerada
4. (Recomendado) Clique em **Edit API Key** e em **API restrictions**, selecione apenas **YouTube Data API v3**

## 4. Adicionar ao Projeto

Adicione a chave no arquivo `.env.local`:

```
YOUTUBE_API_KEY=sua-chave-aqui
```

## Limites de Quota

- **Gratuito**: 10.000 unidades/dia
- `search.list` = 100 unidades por chamada (lista vídeos de um canal)
- `videos.list` = 1 unidade por chamada (metadata de até 50 vídeos)
- `channels.list` = 1 unidade por chamada (info do canal)

Na prática, dá para processar ~50 canais por dia tranquilo.
