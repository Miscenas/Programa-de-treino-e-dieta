export class GoogleFitWebService {
  private static tokenClient: any = null;
  private static accessToken: string | null = null;
  private static CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'seu-client-id-aqui';

  // Carregar Google Identity Services (GIS)
  static async loadGIS(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verificar se já carregou
      if ((window as any).google?.accounts) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        console.log('Google Identity Services loaded successfully');
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Conectar com Google Fit
  static async connect(): Promise<any> {
    try {
      await this.loadGIS();

      return new Promise((resolve, reject) => {
        // Inicializar token client
        this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: this.CLIENT_ID,
          scope: [
            'https://www.googleapis.com/auth/fitness.activity.read',
            'https://www.googleapis.com/auth/fitness.body.read',
            'https://www.googleapis.com/auth/fitness.location.read'
          ].join(' '),
          callback: (response: any) => {
            if (response.error) {
              console.error('Google Fit connection error:', response);
              reject(new Error(response.error));
              return;
            }

            this.accessToken = response.access_token;
            console.log('Google Fit connected successfully');
            resolve(response);
          },
        });

        // Solicitar token
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      });
    } catch (error) {
      console.error('Google Fit connection error:', error);
      throw error;
    }
  }

  // Importar dados dos últimos 30 dias
  static async importData(days: number = 30): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not connected to Google Fit');
    }

    try {
      const endTime = new Date();
      const startTime = new Date();
      startTime.setDate(endTime.getDate() - days);

      // Obter passos diários
      const stepsResponse = await fetch(
        'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aggregateBy: [{
              dataTypeName: 'com.google.step_count.delta',
              dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
            }],
            bucketByTime: { durationMillis: 86400000 }, // 1 day
            startTimeMillis: startTime.getTime(),
            endTimeMillis: endTime.getTime()
          })
        }
      );

      const stepsData = await stepsResponse.json();

      // Obter calorias diárias
      const caloriesResponse = await fetch(
        'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            aggregateBy: [{
              dataTypeName: 'com.google.calories.expended',
              dataSourceId: 'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended'
            }],
            bucketByTime: { durationMillis: 86400000 }, // 1 day
            startTimeMillis: startTime.getTime(),
            endTimeMillis: endTime.getTime()
          })
        }
      );

      const caloriesData = await caloriesResponse.json();

      // Processar dados
      const processedSteps = this.processStepsData(stepsData);
      const processedCalories = this.processCaloriesData(caloriesData);

      console.log('Google Fit data imported:', { processedSteps, processedCalories });

      return {
        steps: processedSteps,
        calories: processedCalories,
        dateRange: { startTime, endTime }
      };

    } catch (error) {
      console.error('Error importing Google Fit data:', error);
      throw error;
    }
  }

  // Processar dados de passos
  private static processStepsData(result: any): any[] {
    if (!result || !result.bucket) {
      return [];
    }

    return result.bucket
      .filter((bucket: any) => bucket.dataset && bucket.dataset[0] && bucket.dataset[0].point && bucket.dataset[0].point.length > 0)
      .map((bucket: any) => {
        const point = bucket.dataset[0].point[0];
        return {
          date: new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0],
          steps: point.value[0].intVal || 0
        };
      });
  }

  // Processar dados de calorias
  private static processCaloriesData(result: any): any[] {
    if (!result || !result.bucket) {
      return [];
    }

    return result.bucket
      .filter((bucket: any) => bucket.dataset && bucket.dataset[0] && bucket.dataset[0].point && bucket.dataset[0].point.length > 0)
      .map((bucket: any) => {
        const point = bucket.dataset[0].point[0];
        return {
          date: new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0],
          calories: Math.round(point.value[0].fpVal || 0)
        };
      });
  }

  // Verificar se está conectado
  static isConnected(): boolean {
    return this.accessToken !== null;
  }

  // Desconectar
  static disconnect(): void {
    this.accessToken = null;
    this.tokenClient = null;
    console.log('Google Fit disconnected');
  }

  // Obter dados do último dia
  static async getTodayData(): Promise<any> {
    const data = await this.importData(1);

    if (data.steps.length > 0) {
      return {
        date: data.steps[0].date,
        steps: data.steps[0].steps,
        calories: data.calories[0]?.calories || 0
      };
    }

    return null;
  }
}

// Adicionar tipagem para window
declare global {
  interface Window {
    google: any;
  }
}
