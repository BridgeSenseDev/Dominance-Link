/**
 * Note: this interface does not include all data returned
 */
interface ICommentsAnalyzeResponse {
  data: {
    attributeScores: {
      TOXICITY: {
        summaryScore: {
          value: number;
        };
      };
      SEVERE_TOXICITY: {
        summaryScore: {
          value: number;
        };
      };
      IDENTITY_ATTACK: {
        summaryScore: {
          value: number;
        };
      };
      INSULT: {
        summaryScore: {
          value: number;
        };
      };
      PROFANITY: {
        summaryScore: {
          value: number;
        };
      };
      THREAT: {
        summaryScore: {
          value: number;
        };
      };
      SEXUALLY_EXPLICIT?: {
        value: number;
      };
    };
  };
}

/**
 * Note: This interface does not include all possible parameters
 */
interface ICommentsAnalyzeRequest {
  comment: {
    text: string;
  };
  requestedAttributes: {
    TOXICITY: Record<string, never>;
    SEVERE_TOXICITY: Record<string, never>;
    IDENTITY_ATTACK: Record<string, never>;
    INSULT: Record<string, never>;
    PROFANITY: Record<string, never>;
    THREAT: Record<string, never>;
    SEXUALLY_EXPLICIT?: Record<string, never>;
  };
}

interface ICommentsAnalyzeArgs {
  key: string;
  resource: ICommentsAnalyzeRequest;
}

interface ICommentsApi {
  analyze: (
    arg1: ICommentsAnalyzeArgs,
    callback: (err: unknown, result: ICommentsAnalyzeResponse) => void,
  ) => void;
}
