import { ConsoleLogger } from '@nestjs/common';
import got from 'got/dist/source';
import { SubmissionRequest } from '../marketplace/dtos/marketplace.dto';

const mockItems = [
  {
    id: 1,
    title: '2020-21 Steph Curry #26  National Treasures Signatures Emerald',
    est_value: 2500,
    subject: 'Curry, Steph',
    grade: 'BGS 9 Mint',
    description: '1/5 Autographed',
    ownerId: 1,
    image_url: 'Card1/IMG_0042.JPG',
    imgRev: 'Card1/IMG_0043.JPG',
    date: new Date(),
  },
  {
    id: 2,
    title:
      '2018-19 Kobe Bryant #1 Select In Flight Signatures Prizms Neon Green',
    est_value: 10800,
    subject: 'Bryant, Kobe',
    grade: 'BGS 9.5 Gem Mint',
    description: 'Autographed',
    ownerId: 1,
    image_url: 'Card2/IMG_0050.JPG',
    imgRev: 'Card2/IMG_0051.JPG',
    date: new Date(),
  },
  {
    id: 3,
    title: '2018-19 Luka Doncic #127 JSY AU National Treasures',
    est_value: 5700,
    subject: 'Doncic, Luka',
    grade: 'BGS 9 Mint',
    description: '46/99 Autographed',
    ownerId: 1,
    image_url: 'Card3/IMG_0235.JPG',
    imgRev: 'Card3/IMG_0236.JPG',
    date: new Date(),
  },
  {
    id: 4,
    title: '2003-04 Lebron James #221 Topps',
    est_value: 4000,
    subject: 'James, Lebron',
    grade: 'BGS 9.5 Gem Mint',
    description: 'Lebron James Rookie Card',
    ownerId: 1,
    image_url: 'Card4/IMG_0353.JPG',
    imgRev: 'Card4/IMG_0354.JPG',
    date: new Date(),
  },
  {
    id: 5,
    title: '2019 Mike Trout Topps Tribute Autographs',
    est_value: 8400,
    subject: 'Trout, Mike',
    grade: 'BGS 9 Mint',
    description: 'Autographed 09/10',
    ownerId: 1,
    image_url: 'Card5/IMG_0651.JPG',
    imgRev: 'Card5/IMG_0652.JPG',
    date: new Date(),
  },
  {
    id: 6,
    title: '1952  Mickey Mantle #311B DP',
    est_value: 180000,
    subject: 'Mantle, Mickey',
    grade: 'BGS 3 Very Good',
    description: 'The iconic Mickey Mantle Rookie Card',
    ownerId: 1,
    image_url: 'Card6/IMG_0741.JPG',
    imgRev: 'Card6/IMG_0742.JPG',
    date: new Date(),
  },
  {
    id: 7,
    title: '1933 Babe Ruth #181 Goudey',
    est_value: 90500,
    subject: 'Ruth, Babe',
    grade: 'BGS 2.5 Good',
    description: 'Iconic Babe Ruth Big League Chewing Gum Card',
    ownerId: 1,
    image_url: 'Card7/IMG_0767.JPG',
    imgRev: 'Card7/IMG_0768.JPG',
    date: new Date(),
  },
  {
    id: 8,
    title: '2017 Patrick Mahomes II #4 Panini Flawless Rookie Patch Autographs',
    est_value: 15000,
    subject: 'Mahomes II, Pattrick',
    grade: 'BGS 9.5 Gem Mint',
    description: 'Patrick Mahomes Rookie Jersey Card Autographed',
    ownerId: 1,
    image_url: 'Card8/IMG_0805.JPG',
    imgRev: 'Card8/IMG_0806.JPG',
    date: new Date(),
  },
  {
    id: 9,
    title: '2019-20 #209 Zion Willaims Panini Mosaic Fast Break Disco Pink',
    est_value: 3000,
    subject: 'Williams, Zion',
    grade: 'BGS 9.5 Gem Mint',
    description: 'Zion William Rookie Card',
    ownerId: 1,
    image_url: 'Card9/IMG_0343.JPG',
    imgRev: 'Card9/IMG_0344.JPG',
    date: new Date(),
  },
  {
    id: 10,
    title: '2020-21 Lamelo Ball #130 AU JSY Nation Treasures',
    est_value: 10300,
    subject: 'Ball, Lamelo',
    grade: 'BGS 9 Mint',
    description: 'LaMelo Ball Autographed Rookie Card 90/99',
    ownerId: 1,
    image_url: 'Card10/IMG_0874.JPG',
    imgRev: 'Card10/IMG_0875.JPG',
    date: new Date(),
  },
  {
    id: 11,
    title: '2013-14 G Antetokounmpo #130 JSY AU National Treasures Gold',
    est_value: 25500,
    subject: 'Antetokounmpo, Giannis',
    grade: 'BGS 7.5 Near Mint',
    description: 'Giannis Antetokounmpo Rookie Jersey Autographed card 02/25',
    ownerId: 1,
    image_url: 'Card11/IMG_1008.JPG',
    imgRev: 'Card11/IMG_1009.JPG',
    date: new Date(),
  },
  {
    id: 12,
    title: '2020 Joe Burrow #156 JSY AU National Treasures',
    est_value: 20000,
    subject: 'Burrow, Joe',
    grade: 'BGS 9.5 Gem Mint',
    description: 'Joe Burrow Rookie Jersey Card Autographed 46/99',
    ownerId: 1,
    image_url: 'Card12/IMG_0853.JPG',
    imgRev: 'Card12/IMG_0854.JPG',
    date: new Date(),
  },
  {
    id: 13,
    title: '1980-81 Bird/Erving/Johnson Topps',
    est_value: 35000,
    subject: 'Bird / Erving / Johnson',
    grade: 'BGS 9 Mint',
    description: 'Larry Bird,Julius Evering,Magic Johnson Tri-card',
    ownerId: 1,
    image_url: 'Card13/IMG_0890.JPG',
    imgRev: 'Card13/IMG_0891.JPG',
    date: new Date(),
  },
  {
    id: 14,
    title: '2001 Tiger Woods #1 Upper Deck',
    est_value: 10500,
    subject: 'Woods, Tiger',
    grade: 'BGS 10 Pristine',
    description: 'Tiger Woods Pristine 10 BGS Black Label',
    ownerId: 1,
    image_url: 'Card14/IMG_0779.JPG',
    imgRev: 'Card14/IMG_0780.JPG',
    date: new Date(),
  },
  {
    id: 15,
    title: '1954 Hank Aaron #128 Topps',
    est_value: 12600,
    subject: 'Aaron, Hank',
    grade: 'BGS 7 Near Mint',
    description: 'Henery Aaron Outfield Milwaukee Braves',
    ownerId: 1,
    image_url: 'Card15/IMG_0743.JPG',
    imgRev: 'Card15/IMG_0744.JPG',
    date: new Date(),
  },
  {
    id: 16,
    title: '1979-80 Wayne Gretzky #15 Topps',
    est_value: 34000,
    subject: 'Gretzky, Wayne',
    grade: 'BGS 8.5',
    description: 'Near Mint Wayne Gretzky Rookie Card Oilers',
    ownerId: 1,
    image_url: 'Card16/IMG_0661.JPG',
    imgRev: 'Card16/IMG_0662.JPG',
    date: new Date(),
  },
];

const owner_uuid = '00000001-0000-0000-0000-000000000000';

// transform a single mock card into a submission request
const mockCardToSubmission = (card) => {
  var submissionRequest = new SubmissionRequest({
    user: owner_uuid,
    grading_company: '',
    serial_number: '',
    title: card.title,
    description: card.description,
    genre: '',
    manufacturer: '',
    year: 0,
    overall_grade: card.grade,
    sub_grades: '',
    autograph: '',
    subject: card.subject,
    est_value: card.est_value,
    image_base64: '',
    image_rev_base64: '',
    image_format: '',
    image_rev_format: '',
    image_path: card.image_url,
    image_rev_path: card.imgRev,
  });
  return submissionRequest;
};

// transform all mock cards into submission requests
const mockCardsToSubmissions = (cards) => {
  var submissions = [];
  cards.forEach((card) => {
    const submission = mockCardToSubmission(card);
    submissions.push(submission);
    console.log(JSON.stringify(submission));
  });

  return submissions;
};

const submissionRequests = mockCardsToSubmissions(mockItems);
console.log(JSON.stringify(submissionRequests.length));

const url = 'http://127.0.0.1:3300/marketplace/submission';
const headers = { 'Content-Type': 'application/json' };

// for each submission request, submit it to the server
async function main() {
  for (var i = 0; i < submissionRequests.length; i++) {
    const response = await got
      .post(url, { json: submissionRequests[i], headers: headers })
      .json();
    console.log(`API response => ${JSON.stringify(response)}`);
  }
}

main();
