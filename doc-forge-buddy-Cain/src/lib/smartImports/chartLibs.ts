// Smart imports para bibliotecas de gráficos
export const chartLibs = {
  // Carregamento assíncrono de bibliotecas de gráficos
  loadChartJs: async () => {
    const Chart = await import('chart.js/auto');
    return Chart.default;
  },

  loadReactChartJs: async () => {
    const chartjs2 = await import('react-chartjs-2');
    
    return {
      ChartComponent: chartjs2.Chart,
      CategoryScale: chartjs2.CategoryScale,
      LinearScale: chartjs2.LinearScale,
      PointElement: chartjs2.PointElement,
      LineElement: chartjs2.LineElement,
      BarElement: chartjs2.BarElement,
      Title: chartjs2.Title,
      Tooltip: chartjs2.Tooltip,
      Legend: chartjs2.Legend,
      ArcElement: chartjs2.ArcElement,
    };
  },

  loadRecharts: async () => {
    const recharts = await import('recharts');
    
    return {
      LineChart: recharts.LineChart,
      Line: recharts.Line,
      AreaChart: recharts.AreaChart,
      Area: recharts.Area,
      BarChart: recharts.BarChart,
      Bar: recharts.Bar,
      PieChart: recharts.PieChart,
      Pie: recharts.Pie,
      Cell: recharts.Cell,
      XAxis: recharts.XAxis,
      YAxis: recharts.YAxis,
      CartesianGrid: recharts.CartesianGrid,
      RechartsTooltip: recharts.Tooltip,
      Legend: recharts.Legend,
      ResponsiveContainer: recharts.ResponsiveContainer,
    };
  },

  loadD3: async () => {
    const d3 = await import('d3');
    return d3;
  },

  // Função principal de carregamento
  default: async function() {
    const chartLibs = {
      chartjs: null,
      reactChartJs: null,
      recharts: null,
      d3: null,
    };

    // Carregar bibliotecas de gráficos por demanda
    const loadPromises = [
      // Chart.js - gráficos básicos
      import('chart.js/auto')
        .then((module) => {
          chartLibs.chartjs = module.default;
        })
        .catch(() => console.warn('chart.js library failed to load')),

      // React Chart.js 2 - wrapper React
      import('react-chartjs-2')
        .then(async (module) => {
          // Importar também os plugins necessários
          const Chart = module.Chart;
          const {
            CategoryScale,
            LinearScale,
            PointElement,
            LineElement,
            BarElement,
            Title,
            Tooltip,
            Legend,
            ArcElement,
          } = await import('chart.js/auto');
          
          // Registrar plugins
          Chart.register(
            CategoryScale,
            LinearScale,
            PointElement,
            LineElement,
            BarElement,
            Title,
            Tooltip,
            Legend,
            ArcElement
          );

          chartLibs.reactChartJs = {
            ChartComponent: module.Chart,
            CategoryScale,
            LinearScale,
            PointElement,
            LineElement,
            BarElement,
            Title,
            Tooltip,
            Legend,
            ArcElement,
          };
        })
        .catch(() => console.warn('react-chartjs-2 library failed to load')),

      // Recharts - gráficos React otimizados
      import('recharts')
        .then((module) => {
          chartLibs.recharts = {
            LineChart: module.LineChart,
            Line: module.Line,
            AreaChart: module.AreaChart,
            Area: module.Area,
            BarChart: module.BarChart,
            Bar: module.Bar,
            PieChart: module.PieChart,
            Pie: module.Pie,
            Cell: module.Cell,
            XAxis: module.XAxis,
            YAxis: module.YAxis,
            CartesianGrid: module.CartesianGrid,
            Tooltip: module.Tooltip,
            Legend: module.Legend,
            ResponsiveContainer: module.ResponsiveContainer,
          };
        })
        .catch(() => console.warn('recharts library failed to load')),

      // D3.js - para gráficos customizados
      import('d3')
        .then((module) => {
          chartLibs.d3 = module;
        })
        .catch(() => console.warn('d3 library failed to load')),
    ];

    await Promise.allSettled(loadPromises);
    
    return chartLibs;
  }
};