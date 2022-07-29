import {
  Item,
  Submission,
  Vaulting,
  User,
  Listing,
  ActionLog,
} from '../database/database.entity';
import {
  ActionLogEntityTypeReadable,
  ActionLogActorTypeReadable,
  ActionLogTypeReadable,
  ListingStatusReadable,
  SubmissionStatusReadable,
  VaultingStatusReadable,
} from '../config/enum';
import {
  ActionLogDetails,
  ListingDetails,
  SubmissionDetails,
  VaultingDetails,
} from '../marketplace/dtos/marketplace.dto';

export function newSubmissionDetails(
  submission: Submission,
  item: Item,
  user: User,
): SubmissionDetails {
  return new SubmissionDetails({
    id: submission.id,
    user: user.uuid,
    item_id: item.id,
    item_uuid: item.uuid,
    status: submission.status,
    status_desc: SubmissionStatusReadable[submission.status],
    grading_company: item.grading_company,
    serial_number: item.serial_number,
    title: item.title,
    description: item.description,
    genre: item.genre,
    manufacturer: item.manufacturer,
    year: item.year,
    overall_grade: item.overall_grade,
    sub_grades: item.sub_grades,
    autograph: item.autograph,
    subject: item.subject,
    est_value: item.est_value,
    image_url: submission.image,
    image_rev_url: submission.image_rev,
    created_at: submission.created_at,
    received_at: submission.received_at,
    approved_at: submission.approved_at,
    rejected_at: submission.rejected_at,
  });
}

export function newVaultingDetails(
  vaulting: Vaulting,
  item: Item,
  user: User,
): VaultingDetails {
  return new VaultingDetails({
    id: vaulting.id,
    user: user.uuid,
    item_id: item.id,
    item_uuid: item.uuid,
    collection: vaulting.collection,
    token_id: vaulting.token_id,
    grading_company: item.grading_company,
    serial_number: item.serial_number,
    title: item.title,
    description: item.description,
    genre: item.genre,
    manufacturer: item.manufacturer,
    year: item.year,
    overall_grade: item.overall_grade,
    sub_grades: item.sub_grades,
    autograph: item.autograph,
    subject: item.subject,
    est_value: item.est_value,
    image_url: vaulting.image,
    status: vaulting.status,
    status_desc: VaultingStatusReadable[vaulting.status],
    mint_tx_hash: vaulting.mint_tx_hash,
    minted_at: vaulting.minted_at,
    burn_tx_hash: vaulting.burn_tx_hash,
    burned_at: vaulting.burned_at,
    chain_id: vaulting.chain_id,
  });
}

export function newListingDetails(
  listing: Listing,
  item: Item,
  user: User,
  vaulting: Vaulting,
): ListingDetails {
  return new ListingDetails({
    id: listing.id,
    user: user.uuid,
    status: listing.status,
    status_desc: ListingStatusReadable[listing.status],
    price: listing.price,
    created_at: listing.created_at,
    updated_at: listing.updated_at,
    item_id: item.id,
    item_uuid: item.uuid,
    grading_company: item.grading_company,
    serial_number: item.serial_number,
    title: item.title,
    description: item.description,
    genre: item.genre,
    manufacturer: item.manufacturer,
    year: item.year,
    overall_grade: item.overall_grade,
    sub_grades: item.sub_grades,
    autograph: item.autograph,
    subject: item.subject,
    image_url: vaulting.image,
  });
}

const base64Threshold = 1000;

export function trimForLoggin(body) {
  var _body = Object.assign({}, body);
  // loop through body and params and shorten base64 data
  for (const key in _body) {
    // remove image
    if (key.includes('base64')) {
      // shorten base64 data
      _body[key] = _body[key].substring(0, 100) + '......';
    }

    // remove password
    if (key.includes('password')) {
      // shorten password data
      _body[key] = '********';
    }

    // trim image
    if (key.includes('image') && _body[key].length > base64Threshold) {
      // shorten base64 data
      _body[key] = _body[key].substring(0, 100) + '......';
    }

    // remove id token
    if (!!_body['idToken'] && !!_body['idToken']['jwtToken']) {
      var _idToken = Object.assign({}, _body['idToken']);
      _idToken['jwtToken'] = '......';
      _idToken['payload'] = '{...}';
      _body['idToken'] = _idToken;
    }

    // remove refresh token
    if (!!_body['refreshToken'] && !!_body['refreshToken']['token']) {
      var _refreshToken = Object.assign({}, _body['refreshToken']);
      _refreshToken['token'] = '......';
      _body['refreshToken'] = _refreshToken;
    }

    // remove access token
    if (!!_body['accessToken'] && !!_body['accessToken']['jwtToken']) {
      var _accessToken = Object.assign({}, _body['accessToken']);
      _accessToken['jwtToken'] = '......';
      _accessToken['payload'] = '{...}';
      _body['accessToken'] = _accessToken;
    }
  }

  return _body;
}

export function trimRequestWithImage(request: any) {
  var _request = Object.assign({}, request);
  // loop through body and params and shorten base64 data
  for (const key in _request) {
    // remove image
    if (key.includes('base64')) {
      // shorten base64 data
      _request[key] = _request[key].substring(0, 100) + '......';
    }

    // trim image
    if (key.includes('image') && _request[key].length > base64Threshold) {
      // shorten base64 data
      _request[key] = _request[key].substring(0, 100) + '......';
    }
  }

  return _request;
}

export function newActionLogDetails(actionLog: ActionLog): ActionLogDetails {
  return new ActionLogDetails({
    id: actionLog.id,
    type: actionLog.type,
    type_desc: ActionLogTypeReadable[actionLog.type],
    actor_type: actionLog.actor_type,
    actor_type_desc: ActionLogActorTypeReadable[actionLog.actor_type],
    actor: actionLog.actor,
    entity_type: actionLog.entity_type,
    entity_type_desc: ActionLogEntityTypeReadable[actionLog.entity_type],
    entity: actionLog.entity,
    created_at: actionLog.created_at,
    extra: actionLog.extra,
  });
}

export function getAttributes(item: Item) {
  var attributes = {
    grading_company: item.grading_company,
    serial_number: item.serial_number,
    title: item.title,
    description: item.description,
    genre: item.genre,
    manufacturer: item.manufacturer,
    year: item.year,
    overall_grade: item.overall_grade,
    sub_grades: item.sub_grades,
    autograph: item.autograph,
    subject: item.subject,
  };

  // remove attributes that are null or undefined
  for (const key in attributes) {
    if (
      attributes[key] == null ||
      attributes[key] == undefined ||
      attributes[key] == ''
    ) {
      delete attributes[key];
    }
  }

  return attributes;
}
