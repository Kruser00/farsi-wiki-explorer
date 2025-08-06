
export interface Source {
  uri: string;
  title: string;
}

export interface Article {
  title: string;
  content: string;
  sources: Source[];
}

export interface DisambiguationChoice {
  topic: string;
  description: string;
}
