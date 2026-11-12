export function demoData() {
  return {
    processador: [
      {
        id: 1,
        nome: 'AMD Ryzen 5 5600',
        fabricante: 'AMD',
        socket: 'AM4',
        consumo: 65,
        preco: 799,
        nucleos: 6,
        threads: 12,
        desempenho: 100
      },
      {
        id: 2,
        nome: 'AMD Ryzen 7 7700',
        fabricante: 'AMD',
        socket: 'AM5',
        consumo: 65,
        preco: 1899,
        nucleos: 8,
        threads: 16,
        desempenho: 150
      }
    ],
    placa_mae: [
      {
        id: 1,
        nome: 'B550M',
        fabricante: 'MSI',
        socket: 'AM4',
        tipo_memoria: 'DDR4',
        consumo: 40,
        preco: 649
      },
      {
        id: 2,
        nome: 'B650M',
        fabricante: 'Gigabyte',
        socket: 'AM5',
        tipo_memoria: 'DDR5',
        consumo: 45,
        preco: 999
      }
    ],
    memoria: [
      {
        id: 1,
        nome: '16 GB DDR4',
        tipo: 'DDR4',
        capacidade: 16,
        frequencia: 3200,
        preco: 249
      },
      {
        id: 2,
        nome: '32 GB DDR5',
        tipo: 'DDR5',
        capacidade: 32,
        frequencia: 5600,
        preco: 649
      }
    ],
    placa_video: [
      {
        id: 1,
        nome: 'GeForce RTX 4060',
        fabricante: 'NVIDIA',
        memoria: 8,
        consumo: 115,
        preco: 1899,
        desempenho: 100
      },
      {
        id: 2,
        nome: 'Radeon RX 7600',
        fabricante: 'AMD',
        memoria: 8,
        consumo: 165,
        preco: 1699,
        desempenho: 95
      }
    ],
    ssd: [
      {
        id: 1,
        nome: 'Kingston NV2 1 TB',
        capacidade: 1000,
        leitura: 3500,
        escrita: 2100,
        tipo: 'NVMe',
        preco: 359
      }
    ],
    fonte: [
      {
        id: 1,
        nome: 'MSI MAG 550W',
        potencia: 550,
        certificacao: '80 Plus Bronze',
        preco: 299
      }
    ],
    jogo: [
      {
        id: 1,
        nome: 'Counter-Strike 2',
        exigencia_cpu: 70,
        exigencia_gpu: 65,
        genero: 'FPS'
      },
      {
        id: 2,
        nome: 'Cyberpunk 2077',
        exigencia_cpu: 85,
        exigencia_gpu: 95,
        genero: 'RPG'
      }
    ],
    benchmark_fps: [
      {
        id: 1,
        jogo_id: 1,
        processador_id: 1,
        placa_video_id: 1,
        resolucao: '1920x1080',
        qualidade: 'Alta',
        fps_medio: 180,
        fps_1_low: 110,
        fonte: 'Dado fictício para demonstração'
      },
      {
        id: 2,
        jogo_id: 2,
        processador_id: 1,
        placa_video_id: 1,
        resolucao: '1920x1080',
        qualidade: 'Alta',
        fps_medio: 65,
        fps_1_low: 45,
        fonte: 'Dado fictício para demonstração'
      }
    ],
    builds: []
  };
}
