import { TrelloCard } from './trello-card.type';
import { TrelloLabel } from './trello-label.type';
import { TrelloList } from './trello-list.type';
import { TrelloMember } from './trello-member.type';
import { WithIdAndName } from './with-id-and-name.type';

/**
 * Represents the root of a Trello JSON export
 *
 * @author Kevin Guanche Darias <kevin@kevinguanchedarias.com>
 * @since 0.1.0
 * @export
 * @interface TrelloExport
 * @extends {WithIdAndName}
 */
export interface TrelloExport extends WithIdAndName {
    closed: boolean;
    url: string;
    labelNames: { [key: string]: string };
    shortUrl: string;
    labels: TrelloLabel[];
    lists: TrelloList[];
    members: TrelloMember[];
    cards: TrelloCard[];
}
